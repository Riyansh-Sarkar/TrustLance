"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Client as EscrowClient, EscrowState, Networks } from "escrow";
import { useWallet } from "./useWallet";
import { submitSignedTransaction, prepareSorobanTx } from "@/lib/stellar/utils";
import { STELLAR_CONFIG, getUSDCSACAddress } from "@/constants/stellar";
import { getAccountBalance } from "@/lib/stellar/client";
import { toast } from "sonner";

export function usdcToStroops(amount: number): bigint {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Invalid amount: must be a non-negative finite number");
  }
  const [intPart, fracPart = ""] = amount.toString().split(".");
  const padded = fracPart.padEnd(7, "0").slice(0, 7);
  return BigInt(intPart + padded);
}

function cleanErrorMessage(err: unknown, defaultMsg: string): string {
  if (!(err instanceof Error)) {
    return defaultMsg;
  }
  const msg = err.message;
  
  // 1. Check for specific contract error codes first
  if (msg.includes("Error(Contract, #1)") || msg.includes("AlreadyInitialized") || msg.includes("data:1") || msg.includes("data: 1")) {
    return "Contract is already initialized and funded on-chain.";
  }
  if (msg.includes("Error(Contract, #2)") || msg.includes("NotInitialized") || msg.includes("data:2") || msg.includes("data: 2")) {
    return "This contract has not been funded or initialized on-chain yet.";
  }
  if (msg.includes("Error(Contract, #3)") || msg.includes("NotDisputed") || msg.includes("data:3") || msg.includes("data: 3")) {
    return "This contract is not currently in a disputed state.";
  }
  if (msg.includes("Error(Contract, #4)") || msg.includes("Unauthorized") || msg.includes("data:4") || msg.includes("data: 4")) {
    return "You are not authorized to perform this action.";
  }
  if (msg.includes("Error(Contract, #5)") || msg.includes("InsufficientBalance") || msg.includes("data:5") || msg.includes("data: 5")) {
    return "Insufficient balance in the escrow contract.";
  }
  if (msg.includes("Error(Contract, #6)") || msg.includes("InvalidMilestoneId") || msg.includes("data:6") || msg.includes("data: 6")) {
    return "Invalid milestone ID.";
  }
  if (msg.includes("Error(Contract, #7)") || msg.includes("InvalidStatus") || msg.includes("data:7") || msg.includes("data: 7")) {
    return "This milestone is in an invalid status for this action.";
  }
  if (msg.includes("Error(Contract, #8)") || msg.includes("NotAParty") || msg.includes("data:8") || msg.includes("data: 8")) {
    return "You are not a client or freelancer for this contract.";
  }

  // 2. Check other known error patterns
  if (msg.includes("resulting balance is not within the allowed range") || msg.includes("Error(Contract, #10)")) {
    return "Insufficient USDC balance in your wallet to fund this contract.";
  }
  if (msg.includes("MissingValue") || msg.includes("non-existing value for contract instance")) {
    return "Failed to communicate with contract instance. It may not be deployed or initialized.";
  }
  if (msg.includes("User denied signature") || msg.includes("denied by the user")) {
    return "Transaction signature request was rejected in your wallet.";
  }
  if (msg.includes("InvalidAction") || msg.includes("WasmVm")) {
    return "This action is invalid for the contract's current state.";
  }
  return msg;
}

export function useEscrow(projectId?: string, contractId?: string) {
  const { isConnected, publicKey, sign } = useWallet();
  const [state, setState] = useState<EscrowState | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedContractId = contractId || STELLAR_CONFIG.contractId;

  const client = useMemo(() => {
    return new EscrowClient({
      networkPassphrase: Networks.TESTNET,
      contractId: resolvedContractId,
      rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org:443",
      publicKey: publicKey || undefined,
    }) as EscrowClient;
  }, [publicKey, resolvedContractId]);

  const fetchState = useCallback(async () => {
    if (!projectId) return;
    setIsFetching(true);
    setError(null);
    try {
      const tx = await client.get_state({ project_id: projectId });
      if (tx.result) {
        setState(tx.result);
      }
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);

      const isUninitialized =
        msg.includes("InvalidAction") ||
        msg.includes("WasmVm") ||
        msg.includes("UnreachableCodeReached") ||
        msg.includes("get_state") ||
        msg.includes("Error(Contract, #2)") ||
        msg.includes("NotInitialized");

      if (isUninitialized) {
        setState(null);
      } else {
        setError("Network error — could not reach the Stellar RPC");
      }
    } finally {
      setIsFetching(false);
    }
  }, [client, projectId]);

  useEffect(() => {
    if (isConnected && projectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchState();
    }
  }, [isConnected, projectId, fetchState]);

  const approveMilestone = useCallback(async (milestoneId: number, customProjectId?: string) => {
    if (!isConnected) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }
    if (isFetching) {
      toast.error("A transaction is already in progress.");
      throw new Error("A transaction is already in progress.");
    }
    setIsFetching(true);
    setError(null);
    const toastId = toast.loading("Waiting for wallet signature...");
    
    try {
      const activeProjectId = customProjectId || projectId;
      if (!activeProjectId) throw new Error("Missing projectId");
      const tx = await client.approve_milestone({ project_id: activeProjectId, milestone_id: milestoneId });

      const unsigned = prepareSorobanTx(tx.built!.toXDR());
      const signedXdr = await sign((await unsigned).toString());
      toast.loading("Submitting transaction to Soroban...", { id: toastId });

      const result = await submitSignedTransaction(signedXdr);

      toast.success("Milestone approved and funds released!", { 
        id: toastId,
        action: {
          label: "View Tx",
          onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${result.txHash}`, "_blank")
        }
      });
      await fetchState();
      return result;
    } catch (err: unknown) {
      const errMsg = cleanErrorMessage(err, "Failed to approve milestone");
      setError(errMsg);
      toast.error(`Transaction Failed: ${errMsg}`, { id: toastId });
      throw new Error(errMsg);
    } finally {
      setIsFetching(false);
    }
  }, [isConnected, isFetching, client, sign, fetchState, projectId]);

  const fundContract = useCallback(async (
    projectId: string,
    freelancerAddress: string,
    amounts: number[],
    descriptions: string[]
  ) => {
    if (!isConnected) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }
    if (isFetching) {
      toast.error("A transaction is already in progress.");
      throw new Error("A transaction is already in progress.");
    }
    setIsFetching(true);
    setError(null);
    const toastId = toast.loading("Checking USDC balance...");
    
    try {
      const totalAmount = amounts.reduce((sum, val) => sum + val, 0);
      
      const { balance: balanceStr, error: balanceError } = await getAccountBalance(publicKey!, "USDC");
      if (balanceError) {
        throw new Error(`Failed to load wallet balance: ${balanceError}`);
      }

      const balance = parseFloat(balanceStr);
      if (balance < totalAmount) {
        const missingAmount = totalAmount - balance;
        const errMsg = `Insufficient USDC balance.\nContract Amount: ${totalAmount} USDC\nYour Balance: ${balance} USDC\nYou need ${missingAmount.toFixed(2)} more USDC to execute this contract.`;
        toast.error(errMsg, { id: toastId, duration: 6000 });
        throw new Error(errMsg);
      }

      toast.loading("Waiting for wallet signature...", { id: toastId });
      const amountsI128 = amounts.map(usdcToStroops);

      const tx = await client.initialize({
        project_id: projectId,
        client: publicKey!,
        freelancer: freelancerAddress,
        token: getUSDCSACAddress(),
        milestone_amounts: amountsI128,
        milestone_descriptions: descriptions,
      });

      const preparedXdr = await prepareSorobanTx(tx.built!.toXDR());
      const signedXdr = await sign(preparedXdr);
      toast.loading("Submitting funding transaction to Soroban...", { id: toastId });
      
      const result = await submitSignedTransaction(signedXdr);

      toast.success("Contract funded successfully!", { 
        id: toastId,
        action: {
          label: "View Tx",
          onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${result.txHash}`, "_blank")
        }
      });

      await new Promise(r => setTimeout(r, 1500));
      await fetchState();
      
      return result;
    } catch (err: unknown) {
      const errMsg = cleanErrorMessage(err, "Failed to initialize escrow");
      if (errMsg.includes("already initialized") || errMsg.includes("AlreadyInitialized") || errMsg.includes("data:1") || errMsg.includes("data: 1")) {
        toast.dismiss(toastId);
        toast.success("Contract is already initialized on-chain. Syncing state...");
        await fetchState();
        return;
      }
      setError(errMsg);
      toast.error(`Transaction Failed: ${errMsg}`, { id: toastId });
      throw new Error(errMsg);
    } finally {
      setIsFetching(false);
    }
  }, [isConnected, isFetching, client, publicKey, sign, fetchState]);

  const submitMilestone = useCallback(async (milestoneId: number, customProjectId?: string) => {
    if (!isConnected) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }
    if (isFetching) {
      toast.error("A transaction is already in progress.");
      throw new Error("A transaction is already in progress.");
    }
    setIsFetching(true);
    setError(null);
    const toastId = toast.loading("Waiting for wallet signature...");

    try {
      const onChain = state;
      const ms = onChain?.milestones?.[milestoneId];
      if (ms) {
        const statusVal = ms.status as any;
        let tag = "";
        if (typeof statusVal === 'string') {
          tag = statusVal;
        } else if (typeof statusVal === 'number') {
          const statuses = ["pending", "submitted", "approved", "released", "disputed"];
          tag = statuses[statusVal] || "";
        } else if (statusVal?.tag) {
          tag = statusVal.tag;
        }
        tag = tag.toLowerCase();

        if (tag !== "pending") {
          throw new Error(`This milestone has already been submitted and is awaiting client approval.`);
        }
      }

      const activeProjectId = customProjectId || projectId;
      if (!activeProjectId) throw new Error("Missing projectId");

      console.log("[debug] submitMilestone invocation details:", {
        contractId: resolvedContractId,
        projectId: activeProjectId,
        milestoneIndex: milestoneId,
        walletAddress: publicKey,
        stateLoaded: !!state,
        onChainMilestones: state?.milestones ? JSON.stringify(state.milestones, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        ) : "null",
        onChainEscrowInitialized: state?.initialized,
        onChainEscrowClosed: state?.is_closed,
        onChainEscrowDisputed: state?.is_disputed,
      });

      const tx = await client.submit_milestone({ project_id: activeProjectId, milestone_id: milestoneId });

      const preparedXdr = await prepareSorobanTx(tx.built!.toXDR());
      const signedXdr = await sign(preparedXdr);
      toast.loading("Submitting deliverable to Soroban...", { id: toastId });

      const result = await submitSignedTransaction(signedXdr);

      toast.success("Deliverable submitted on-chain!", { 
        id: toastId,
        action: {
          label: "View Tx",
          onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${result.txHash}`, "_blank")
        }
      });
      await fetchState();
      return result;
    } catch (err: unknown) {
      console.error("submitMilestone error:", err);
      const errMsg = cleanErrorMessage(err, "Failed to submit milestone");
      setError(errMsg);
      toast.error(`Transaction Failed: ${errMsg}`, { id: toastId });
      throw new Error(errMsg);
    } finally {
      setIsFetching(false);
    }
  }, [isConnected, isFetching, client, state, sign, fetchState, projectId]);

  const flagDispute = useCallback(async (customProjectId?: string) => {
    if (!isConnected || !publicKey) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }
    if (isFetching) {
      toast.error("A transaction is already in progress.");
      throw new Error("A transaction is already in progress.");
    }
    setIsFetching(true);
    setError(null);
    const toastId = toast.loading("Waiting for wallet signature...");
    try {
      const activeProjectId = customProjectId || projectId;
      if (!activeProjectId) throw new Error("Missing projectId");
      const tx = await client.flag_dispute({ project_id: activeProjectId, caller: publicKey });
      const preparedXdr = await prepareSorobanTx(tx.built!.toXDR());
      const signedXdr = await sign(preparedXdr);
      toast.loading("Submitting dispute to Soroban...", { id: toastId });
      const result = await submitSignedTransaction(signedXdr);
      toast.success("Dispute flagged successfully!", { 
        id: toastId,
        action: {
          label: "View Tx",
          onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${result.txHash}`, "_blank")
        }
      });
      await fetchState();
      return result;
    } catch (err: unknown) {
      const errMsg = cleanErrorMessage(err, "Failed to flag dispute");
      setError(errMsg);
      toast.error(`Transaction Failed: ${errMsg}`, { id: toastId });
      throw new Error(errMsg);
    } finally {
      setIsFetching(false);
    }
  }, [isConnected, isFetching, client, publicKey, sign, fetchState, projectId]);

  const resolveDispute = useCallback(async (
    resolver: string,
    releaseTo: string,
    amount: number,
    customProjectId?: string
  ) => {
    if (!isConnected) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }
    if (isFetching) {
      toast.error("A transaction is already in progress.");
      throw new Error("A transaction is already in progress.");
    }
    setIsFetching(true);
    setError(null);
    const toastId = toast.loading("Waiting for wallet signature...");
    try {
      const activeProjectId = customProjectId || projectId;
      if (!activeProjectId) throw new Error("Missing projectId");
      const amountI128 = usdcToStroops(amount);
      const tx = await client.resolve_dispute({
        project_id: activeProjectId,
        resolver,
        release_to: releaseTo,
        amount: amountI128,
      });
      const preparedXdr = await prepareSorobanTx(tx.built!.toXDR());
      const signedXdr = await sign(preparedXdr);
      toast.loading("Submitting resolution to Soroban...", { id: toastId });
      const result = await submitSignedTransaction(signedXdr);
      toast.success("Dispute resolved successfully!", { 
        id: toastId,
        action: {
          label: "View Tx",
          onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${result.txHash}`, "_blank")
        }
      });
      await fetchState();
      return result;
    } catch (err: unknown) {
      const errMsg = cleanErrorMessage(err, "Failed to resolve dispute");
      setError(errMsg);
      toast.error(`Transaction Failed: ${errMsg}`, { id: toastId });
      throw new Error(errMsg);
    } finally {
      setIsFetching(false);
    }
  }, [isConnected, isFetching, client, sign, fetchState, projectId]);

  const cancelContract = useCallback(async (customProjectId?: string) => {
    if (!isConnected || !publicKey) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }
    if (isFetching) {
      toast.error("A transaction is already in progress.");
      throw new Error("A transaction is already in progress.");
    }
    setIsFetching(true);
    setError(null);
    const toastId = toast.loading("Waiting for wallet signature...");
    try {
      const activeProjectId = customProjectId || projectId;
      if (!activeProjectId) throw new Error("Missing projectId");
      const tx = await client.cancel_contract({ project_id: activeProjectId });
      const preparedXdr = await prepareSorobanTx(tx.built!.toXDR());
      const signedXdr = await sign(preparedXdr);
      toast.loading("Submitting cancellation to Soroban...", { id: toastId });
      const result = await submitSignedTransaction(signedXdr);
      toast.success("Contract cancelled successfully!", { 
        id: toastId,
        action: {
          label: "View Tx",
          onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${result.txHash}`, "_blank")
        }
      });
      await fetchState();
      return result;
    } catch (err: unknown) {
      const errMsg = cleanErrorMessage(err, "Failed to cancel contract");
      setError(errMsg);
      toast.error(`Transaction Failed: ${errMsg}`, { id: toastId });
      throw new Error(errMsg);
    } finally {
      setIsFetching(false);
    }
  }, [isConnected, isFetching, client, publicKey, sign, fetchState, projectId]);

  return {
    state,
    isLoading: isFetching,
    error,
    refresh: fetchState,
    fundContract,
    submitMilestone,
    approveMilestone,
    flagDispute,
    resolveDispute,
    cancelContract,
  };
}