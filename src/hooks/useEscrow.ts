"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Client as EscrowClient, EscrowState, Networks } from "escrow";
import { useWallet } from "./useWallet";
import { submitSignedTransaction, prepareSorobanTx } from "@/lib/stellar/utils";
import { STELLAR_CONFIG, getUSDCSACAddress } from "@/constants/stellar";
import { toast } from "sonner";

export function usdcToStroops(amount: number): bigint {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Invalid amount: must be a non-negative finite number");
  }
  const [intPart, fracPart = ""] = amount.toString().split(".");
  const padded = fracPart.padEnd(7, "0").slice(0, 7);
  return BigInt(intPart + padded);
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
        msg.includes("get_state");

      if (isUninitialized) {
        setState(null);
      } else {
        setError("Network error — could not reach the Stellar RPC");
      }
    } finally {
      setIsFetching(false);
    }
  }, [client]);

  useEffect(() => {
    if (isConnected && projectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchState();
    }
  }, [isConnected, projectId, fetchState]);

  const approveMilestone = useCallback(async (milestoneId: number) => {
    if (!isConnected) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }
    setIsFetching(true);
    setError(null);
    const toastId = toast.loading("Waiting for wallet signature...");
    
    try {
      if (!projectId) throw new Error("Missing projectId");
      const tx = await client.approve_milestone({ project_id: projectId, milestone_id: milestoneId });

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
      const errMsg = err instanceof Error ? err.message : "Failed to approve milestone";
      setError(errMsg);
      toast.error(`Transaction Failed: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setIsFetching(false);
    }
  }, [isConnected, client, sign, fetchState]);

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
    setIsFetching(true);
    setError(null);
    const toastId = toast.loading("Waiting for wallet signature...");
    
    try {
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
      const errMsg = err instanceof Error ? err.message : "Failed to initialize escrow";
      if (errMsg.includes("AlreadyInitialized") || errMsg.includes("data:1") || errMsg.includes("data: 1")) {
        toast.dismiss(toastId);
        toast.success("Contract is already initialized on-chain. Syncing state...");
        await fetchState();
        return;
      }
      setError(errMsg);
      toast.error(`Transaction Failed: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setIsFetching(false);
    }
  }, [isConnected, client, publicKey, sign, fetchState]);

  const submitMilestone = useCallback(async (milestoneId: number) => {
    if (!isConnected) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
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
          throw new Error(`This milestone is not in a submittable state. Current state: ${tag}`);
        }
      }

      if (!projectId) throw new Error("Missing projectId");
      const tx = await client.submit_milestone({ project_id: projectId, milestone_id: milestoneId });

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
      const errMsg = err instanceof Error ? err.message : "Failed to submit milestone";
      setError(errMsg);
      toast.error(`Transaction Failed: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setIsFetching(false);
    }
  }, [isConnected, client, state, sign, fetchState]);

  const flagDispute = useCallback(async () => {
    if (!isConnected || !publicKey) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }
    setIsFetching(true);
    setError(null);
    const toastId = toast.loading("Waiting for wallet signature...");
    try {
      if (!projectId) throw new Error("Missing projectId");
      const tx = await client.flag_dispute({ project_id: projectId, caller: publicKey });
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
      const errMsg = err instanceof Error ? err.message : "Failed to flag dispute";
      setError(errMsg);
      toast.error(`Transaction Failed: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setIsFetching(false);
    }
  }, [isConnected, client, publicKey, sign, fetchState]);

  const resolveDispute = useCallback(async (
    resolver: string,
    releaseTo: string,
    amount: number
  ) => {
    // The Rust contract gates resolve_dispute on `if resolver != state.admin`
    // (contracts/escrow/src/lib.rs:207). Today the only admin is the client
    // (initialize pins admin == client), so callers should pass the on-chain
    // admin rather than any arbitrary wallet. When a real admin role is
    // added, surface it from state.admin and pass that here.
    if (!isConnected) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }
    setIsFetching(true);
    setError(null);
    const toastId = toast.loading("Waiting for wallet signature...");
    try {
      if (!projectId) throw new Error("Missing projectId");
      const amountI128 = usdcToStroops(amount);
      const tx = await client.resolve_dispute({
        project_id: projectId,
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
      const errMsg = err instanceof Error ? err.message : "Failed to resolve dispute";
      setError(errMsg);
      toast.error(`Transaction Failed: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setIsFetching(false);
    }
  }, [isConnected, client, sign, fetchState]);

  const cancelContract = useCallback(async () => {
    if (!isConnected || !publicKey) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }
    setIsFetching(true);
    setError(null);
    const toastId = toast.loading("Waiting for wallet signature...");
    try {
      if (!projectId) throw new Error("Missing projectId");
      const tx = await client.cancel_contract({ project_id: projectId });
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
      const errMsg = err instanceof Error ? err.message : "Failed to cancel contract";
      setError(errMsg);
      toast.error(`Transaction Failed: ${errMsg}`, { id: toastId });
      throw err;
    } finally {
      setIsFetching(false);
    }
  }, [isConnected, client, publicKey, sign, fetchState]);

  return {
    state,
    isLoading: isFetching,
    error,
    refresh:    fetchState,
    fundContract,
    submitMilestone,
    approveMilestone,
    flagDispute,
    resolveDispute,
    cancelContract,
  };
}