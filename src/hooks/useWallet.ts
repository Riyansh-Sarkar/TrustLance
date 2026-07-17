"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { SupportedWallet } from "@/types";

interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  walletNetwork: string | null;
}

const DEFAULT_STATE: WalletState = {
  publicKey: null,
  isConnected: false,
  isLoading: true,
  error: null,
  walletNetwork: null,
};

function getWalletAddress(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fp_wallet_address");
}

function setWalletAddress(address: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("fp_wallet_address", address);
  }
}

function clearWalletAddress() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("fp_wallet_address");
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export function useWallet() {
  const [state, setState] = useState<WalletState>(() => {
    if (typeof window === "undefined") return DEFAULT_STATE;
    const savedAddress = getWalletAddress();
    return {
      publicKey: savedAddress,
      isConnected: !!savedAddress,
      isLoading: true,
      error: null,
      walletNetwork: null,
    };
  });

  const [supportedWallets] = useState<SupportedWallet[]>([
    {
      id: "freighter",
      name: "Freighter",
      icon: "/logo.svg",
      isAvailable: true,
    },
  ]);

  const [isModalOpen, setModalOpen] = useState(false);

  const detectWalletNetwork = useCallback(async (): Promise<string | null> => {
    try {
      const { getNetworkDetails } = await import("@stellar/freighter-api");
      const nd = await withTimeout(getNetworkDetails(), 3000);
      if (nd && nd.network) {
        return String(nd.network).toUpperCase();
      }
    } catch (e) {
      console.warn("Freighter getNetworkDetails failed:", e);
    }
    return null;
  }, []);

  const initWallet = useCallback(async () => {
    const savedAddress = getWalletAddress();
    if (!savedAddress) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    try {
      const { isConnected: checkConnected, getAddress } = await import("@stellar/freighter-api");
      const res = await checkConnected();
      const hasFreighter = res && res.isConnected;
      if (!hasFreighter) {
        setState((s) => ({ ...s, isLoading: false, publicKey: null, isConnected: false }));
        clearWalletAddress();
        return;
      }

      const addrRes = await getAddress();
      if (addrRes.error || !addrRes.address || addrRes.address !== savedAddress) {
        setState((s) => ({ ...s, isLoading: false, publicKey: null, isConnected: false }));
        clearWalletAddress();
        return;
      }

      const activeNetwork = await detectWalletNetwork();
      setState((s) => ({
        ...s,
        publicKey: savedAddress,
        isConnected: true,
        isLoading: false,
        walletNetwork: activeNetwork,
      }));
    } catch (err) {
      console.error("Wallet initialization error:", err);
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [detectWalletNetwork]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initWallet();
  }, [initWallet]);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const connectWallet = useCallback(async (id: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      if (id !== "freighter") {
        throw new Error("Only Freighter is supported.");
      }

      const { isConnected: checkConnected, requestAccess, signMessage } = await import("@stellar/freighter-api");
      
      const res = await checkConnected();
      const hasFreighter = res && res.isConnected;
      if (!hasFreighter) {
        throw new Error("Freighter wallet is not installed.");
      }

      let address: string;
      try {
        const access = await withTimeout(requestAccess(), 10000);
        if (access.error) throw new Error(access.error);
        address = access.address;
      } catch (err: any) {
        throw new Error(err.message || "Failed to retrieve address. Please unlock Freighter and grant access.");
      }

      // Authentication flow (challenge-response)
      const nonceRes = await fetch("/api/auth/nonce");
      const nonceText = await nonceRes.text();
      let nonce: string;
      try {
        const parsed = JSON.parse(nonceText);
        if (!nonceRes.ok) throw new Error(parsed.error || "Failed to fetch nonce");
        nonce = parsed.nonce;
      } catch (e) {
        throw new Error(`Server returned non-JSON for nonce (Status ${nonceRes.status})`);
      }

      // Store/post nonce (stateless POST step in verify flow, can be optional but let's keep it to preserve workflow)
      await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: address, nonce }),
      });

      // Sign message challenge
      let signature: string;
      try {
        const signResult = await signMessage(nonce, { address });
        if (signResult && typeof signResult === "object") {
          if (signResult.error) throw new Error(signResult.error);
          if (signResult.signedMessage) {
            signature = typeof signResult.signedMessage === "string"
              ? signResult.signedMessage
              : Buffer.from(signResult.signedMessage).toString("base64");
          } else {
            throw new Error("Message signature empty");
          }
        } else {
          throw new Error("Invalid signature response");
        }
      } catch (err: any) {
        throw new Error(err.message || "Message signing rejected by user.");
      }

      // Verify signature on backend
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: address, signature, nonce }),
      });

      if (!verifyRes.ok) {
        const text = await verifyRes.text();
        let errorMsg = "Failed to verify wallet signature";
        try {
          const errData = JSON.parse(text);
          if (errData.error) errorMsg = errData.error;
        } catch {}
        throw new Error(errorMsg);
      }

      // Setup session
      setWalletAddress(address);
      const activeNetwork = await detectWalletNetwork();
      
      setState({
        publicKey: address,
        isConnected: true,
        isLoading: false,
        error: null,
        walletNetwork: activeNetwork || (process.env.NEXT_PUBLIC_STELLAR_NETWORK === "PUBLIC" ? "MAINNET" : "TESTNET"),
      });
      setModalOpen(false);
      toast.success("Wallet connected successfully!");

      // Analytics tracking
      try {
        if (typeof window !== "undefined") {
          import("posthog-js").then(({ default: ph }) => {
            if (ph && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
              ph.capture("wallet_connected", { wallet: address });
              ph.identify(address);
            }
          });
        }
      } catch {}

      return true;
    } catch (err: any) {
      const errMsg = err.message || "Failed to connect wallet";
      toast.error(`Connection Failed: ${errMsg}`);
      setState((s) => ({ ...s, isLoading: false, error: errMsg }));
      setModalOpen(false);
      return false;
    }
  }, [detectWalletNetwork]);

  const disconnectWallet = useCallback(async () => {
    clearWalletAddress();
    setState(DEFAULT_STATE);
    
    try {
      if (typeof window !== "undefined") {
        import("posthog-js").then(({ default: ph }) => {
          if (ph) ph.reset();
        });
      }
    } catch {}
    setState((s) => ({ ...s, isLoading: false }));
  }, []);

  const sign = useCallback(async (xdr: string) => {
    if (!state.publicKey) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }

    try {
      const { signTransaction } = await import("@stellar/freighter-api");
      const networkPassphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "PUBLIC" 
        ? "Public Global Stellar Network ; September 2015" 
        : "Test SDF Network ; September 2015";

      const signResult = await signTransaction(xdr, { networkPassphrase, address: state.publicKey });
      
      let signedXdr: string;
      if (signResult && typeof signResult === "object") {
        if (signResult.error) throw new Error(signResult.error);
        if (signResult.signedTxXdr) {
          signedXdr = signResult.signedTxXdr;
        } else {
          throw new Error("Transaction signature empty");
        }
      } else {
        throw new Error("Invalid signature response");
      }

      return signedXdr;
    } catch (err: any) {
      const msg = err.message || "User rejected the request";
      toast.error(`Signature Failed: ${msg}`);
      throw err;
    }
  }, [state.publicKey]);

  return {
    ...state,
    supportedWallets,
    isModalOpen,
    openModal,
    closeModal,
    connectWallet,
    disconnectWallet,
    sign,
  };
}