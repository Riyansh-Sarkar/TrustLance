import {
  TransactionBuilder,
  type Transaction,
  type FeeBumpTransaction,
  rpc,
} from "@stellar/stellar-sdk";
import { sorobanServer, horizonServer } from "./client";
import { STELLAR_CONFIG } from "@/constants/stellar";

const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 1000;

export type SignedTransaction = Transaction | FeeBumpTransaction;

function parseSignedXdr(signedXdr: string): SignedTransaction {
  return TransactionBuilder.fromXDR(signedXdr, STELLAR_CONFIG.network);
}

/**
 * For Soroban contract calls (escrow auto-binding, etc.) the binding
 * returns a Transaction whose envelope does NOT yet carry the
 * SorobanTransactionData extension or auth-vec populated by the network's
 * prepare/simulate path. Without that step the host rejects the XDR with
 * `txMalformed` (-16). Call this before handing the XDR to Freighter/page-
 * signer and then to submitSignedTransaction.
 */
export async function prepareSorobanTx(unsignedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(unsignedXdr, STELLAR_CONFIG.network) as Transaction;
  const prepared = await sorobanServer.prepareTransaction(tx);
  return prepared.toXDR();
}

export async function submitSignedTransaction(signedXdr: string) {
  const tx = parseSignedXdr(signedXdr);

  const result = await sorobanServer.sendTransaction(tx);
  if (result.status === "ERROR") {
    throw new Error(`Transaction failed: ${JSON.stringify(result.errorResult)}`);
  }

  const poll = async (attempt: number): Promise<rpc.Api.GetTransactionResponse & { txHash: string }> => {
    if (attempt >= MAX_POLL_ATTEMPTS) {
      throw new Error(`Transaction polling timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`);
    }
    const getResult = await sorobanServer.getTransaction(result.hash);

    if (getResult.status === "NOT_FOUND") {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      return poll(attempt + 1);
    }

    if (getResult.status === rpc.Api.GetTransactionStatus.FAILED) {
      const details: Record<string, unknown> = {
        status: getResult.status,
      };
      if ("resultXdr" in getResult) {
        details.resultXdr = getResult.resultXdr;
      }
      if ("hash" in getResult) {
        details.hash = (getResult as { hash: string }).hash;
      }
      throw new Error(
        `Transaction execution failed: ${JSON.stringify(details)}`
      );
    }

    return Object.assign(getResult, { txHash: result.hash });
  };

  return poll(0);
}

export async function submitHorizonTransaction(signedXdr: string) {
  const tx = parseSignedXdr(signedXdr);
  try {
    const result = await horizonServer.submitTransaction(tx);
    if (result && "successful" in result && result.successful === false) {
      throw new Error(`Classic transaction failed (tx_failed) for hash ${result.hash}`);
    }
    return result;
  } catch (err: any) {
    if (err.response?.data?.extras?.result_codes) {
      const codes = err.response.data.extras.result_codes;
      const txCode = codes.transaction;
      const opCodes = codes.operations?.join(", ");
      throw new Error(`Transaction failed: ${txCode} ${opCodes ? `(${opCodes})` : ""}`);
    }
    throw err;
  }
}