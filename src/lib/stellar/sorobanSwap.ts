import {
  Address,
  Asset,
  Operation,
  TransactionBuilder,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";
import { horizonServer, sorobanServer } from "./client";
import { STELLAR_CONFIG, getUSDCSACAddress } from "@/constants/stellar";

const BASE_FEE = "100";
const TX_TIMEOUT_SECONDS = 300;

function addressToScVal(addr: string): xdr.ScVal {
  return nativeToScVal(Address.fromString(addr), { type: "address" });
}

export interface SorobanSwapParams {
  publicKey: string;
  sendAsset: Asset;
  sendAmount: string;
  minDestAmount: string;
}

export async function buildSorobanSwapTx(
  params: SorobanSwapParams
): Promise<string> {
  const ammId = STELLAR_CONFIG.ammContractId;
  if (!ammId) {
    throw new Error(
      "AMM contract not configured. Set NEXT_PUBLIC_AMM_CONTRACT_ID."
    );
  }

  const account = await horizonServer.loadAccount(params.publicKey);

  const sendTokenAddress = params.sendAsset.isNative()
    ? getNativeXlmSACAddress()
    : getUSDCSACAddress();

  const args: xdr.ScVal[] = [
    addressToScVal(params.publicKey),
    addressToScVal(sendTokenAddress),
    nativeToScVal(params.sendAmount, { type: "i128" }),
    nativeToScVal(params.minDestAmount, { type: "i128" }),
  ];

  const hostFunction = xdr.HostFunction.hostFunctionTypeInvokeContract(
    new xdr.InvokeContractArgs({
      contractAddress: Address.fromString(ammId).toScAddress(),
      functionName: "swap",
      args,
    })
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.network,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: hostFunction,
        auth: [],
      })
    )
    .setTimeout(TX_TIMEOUT_SECONDS)
    .build();

  const prepared = await sorobanServer.prepareTransaction(tx);
  return prepared.toXDR();
}

function getNativeXlmSACAddress(): string {
  // On testnet & pubnet, the SAC address derived from the native asset is
  // the canonical contract id — no hardcoded fallback (the prior fallback
  // address has an invalid checksum and produced `txMalformed`).
  const nativeAsset = Asset.native();
  return nativeAsset.contractId(STELLAR_CONFIG.network);
}