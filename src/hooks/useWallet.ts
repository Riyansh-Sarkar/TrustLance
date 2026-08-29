"use client";

import { useState, useEffect, useCallback } from "react";
import { Account, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { toast } from "sonner";
import type { SupportedWallet } from "@/types";
import { STELLAR_CONFIG } from "@/constants/stellar";
import {
  getStellarWalletKit,
  isSupportedStellarWalletId,
  normalizeKitWallets,
  STELLAR_WALLET_IDS,
  type StellarWalletId,
} from "@/lib/stellar/walletKit";

interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  walletNetwork: string | null;
  walletId: StellarWalletId | null;
}

const AUTH_MANAGE_DATA_NAME = "TrustLance Auth";
const WALLET_ADDRESS_KEY = "fp_wallet_address";
const WALLET_ID_KEY = "fp_wallet_id";
const DEFAULT_WALLET_ID = STELLAR_WALLET_IDS.freighter;

const DEFAULT_SUPPORTED_WALLETS: SupportedWallet[] = [
  { id: STELLAR_WALLET_IDS.freighter, name: "Freighter", icon: "/logo.svg", isAvailable: true },
  { id: STELLAR_WALLET_IDS.xbull, name: "xBull", icon: "/logo.svg", isAvailable: true },
  { id: STELLAR_WALLET_IDS.albedo, name: "Albedo", icon: "/logo.svg", isAvailable: true },
  { id: STELLAR_WALLET_IDS.rabet, name: "Rabet", icon: "/logo.svg", isAvailable: false },
  { id: STELLAR_WALLET_IDS.hana, name: "Hana Wallet", icon: "/logo.svg", isAvailable: false },
  { id: STELLAR_WALLET_IDS.lobstr, name: "LOBSTR", icon: "/logo.svg", isAvailable: false },
];

const DEFAULT_STATE: WalletState = {
  publicKey: null,
  isConnected: false,
  isLoading: true,
  error: null,
  walletNetwork: null,
  walletId: null,
};

function getWalletAddress(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WALLET_ADDRESS_KEY);
}

function getWalletId(): StellarWalletId | null {
  if (typeof window === "undefined") return null;
  const savedWalletId = localStorage.getItem(WALLET_ID_KEY);
  return savedWalletId && isSupportedStellarWalletId(savedWalletId) ? savedWalletId : null;
}

function setWalletSession(address: string, walletId: StellarWalletId) {
  if (typeof window !== "undefined") {
    localStorage.setItem(WALLET_ADDRESS_KEY, address);
    localStorage.setItem(WALLET_ID_KEY, walletId);
  }
}

function clearWalletSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(WALLET_ADDRESS_KEY);
    localStorage.removeItem(WALLET_ID_KEY);
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

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message || fallback;
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  if (typeof err === "string" && err) return err;
  return fallback;
}

function normalizeNetwork(network?: string | null, networkPassphrase?: string | null): string | null {
  const value = `${network ?? ""} ${networkPassphrase ?? ""}`.toUpperCase();
  if (value.includes("PUBLIC") || value.includes("MAINNET")) return "MAINNET";
  if (value.includes("TEST")) return "TESTNET";
  return null;
}

function shortenAddress(address: string): string {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function buildAuthTransactionXdr(publicKey: string, nonce: string): string {
  const sourceAccount = new Account(publicKey, "0");

  return new TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: STELLAR_CONFIG.network,
  })
    .addOperation(Operation.manageData({ name: AUTH_MANAGE_DATA_NAME, value: nonce }))
    .setTimeout(300)
    .build()
    .toXDR();
}

export function useWallet() {
  const [state, setState] = useState<WalletState>(() => {
    if (typeof window === "undefined") return DEFAULT_STATE;
    const savedAddress = getWalletAddress();
    const savedWalletId = savedAddress ? getWalletId() ?? DEFAULT_WALLET_ID : null;
    return {
      publicKey: savedAddress,
      isConnected: !!savedAddress,
      isLoading: true,
      error: null,
      walletNetwork: savedAddress ? "TESTNET" : null,
      walletId: savedWalletId,
    };
  });

  const [supportedWallets, setSupportedWallets] = useState<SupportedWallet[]>(DEFAULT_SUPPORTED_WALLETS);
  const [isModalOpen, setModalOpen] = useState(false);

  const refreshSupportedWallets = useCallback(async () => {
    try {
      const { StellarWalletsKit } = await getStellarWalletKit();
      const wallets = await StellarWalletsKit.refreshSupportedWallets();
      setSupportedWallets(normalizeKitWallets(wallets));
    } catch (err) {
      console.warn("Stellar Wallets Kit discovery failed:", err);
      setSupportedWallets(DEFAULT_SUPPORTED_WALLETS);
    }
  }, []);

  const detectWalletNetwork = useCallback(async (): Promise<string | null> => {
    try {
      const { StellarWalletsKit } = await getStellarWalletKit();
      const network = await withTimeout(StellarWalletsKit.getNetwork(), 3000);
      return normalizeNetwork(network.network, network.networkPassphrase);
    } catch (err) {
      console.warn("Wallet network detection unavailable:", err);
      return "TESTNET";
    }
  }, []);

  const initWallet = useCallback(async () => {
    await refreshSupportedWallets();

    const savedAddress = getWalletAddress();
    if (!savedAddress) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    const savedWalletId = getWalletId() ?? DEFAULT_WALLET_ID;
    try {
      const { StellarWalletsKit } = await getStellarWalletKit();
      StellarWalletsKit.setWallet(savedWalletId);
      StellarWalletsKit.setNetwork(STELLAR_CONFIG.network);

      const activeNetwork = await detectWalletNetwork();
      setState((s) => ({
        ...s,
        publicKey: savedAddress,
        isConnected: true,
        isLoading: false,
        walletNetwork: activeNetwork,
        walletId: savedWalletId,
      }));
    } catch (err) {
      console.error("Wallet initialization error:", err);
      clearWalletSession();
      setState({ ...DEFAULT_STATE, isLoading: false });
    }
  }, [detectWalletNetwork, refreshSupportedWallets]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initWallet();
  }, [initWallet]);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const verifyAuthProof = useCallback(async (
    publicKey: string,
    nonce: string,
    proof: { signature?: string; authTransactionXdr?: string }
  ) => {
    const verifyRes = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey, nonce, ...proof }),
    });

    if (!verifyRes.ok) {
      const text = await verifyRes.text();
      let errorMsg = "Failed to verify wallet signature";
      try {
        const errData = JSON.parse(text);
        if (errData.error) errorMsg = errData.error;
      } catch {
        // Keep the generic message if the response is not JSON.
      }
      throw new Error(errorMsg);
    }
  }, []);

  const authenticateWallet = useCallback(async (walletId: StellarWalletId, address: string) => {
    const nonceRes = await fetch("/api/auth/nonce");
    const nonceText = await nonceRes.text();
    let nonce: string;
    try {
      const parsed = JSON.parse(nonceText);
      if (!nonceRes.ok) throw new Error(parsed.error || "Failed to fetch nonce");
      nonce = parsed.nonce;
    } catch {
      throw new Error(`Server returned non-JSON for nonce (Status ${nonceRes.status})`);
    }

    await fetch("/api/auth/nonce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey: address, nonce }),
    });

    const { StellarWalletsKit } = await getStellarWalletKit();
    if (walletId === STELLAR_WALLET_IDS.freighter) {
      try {
        const signResult = await withTimeout(
          StellarWalletsKit.signMessage(nonce, {
            networkPassphrase: STELLAR_CONFIG.network,
            address,
          }),
          30000
        );
        await verifyAuthProof(address, nonce, { signature: signResult.signedMessage });
        return;
      } catch (err) {
        console.warn("Message auth failed; falling back to signed auth transaction:", err);
      }
    }

    const unsignedAuthXdr = buildAuthTransactionXdr(address, nonce);
    const { signedTxXdr } = await withTimeout(
      StellarWalletsKit.signTransaction(unsignedAuthXdr, {
        networkPassphrase: STELLAR_CONFIG.network,
        address,
      }),
      60000
    );
    await verifyAuthProof(address, nonce, { authTransactionXdr: signedTxXdr });
  }, [verifyAuthProof]);

  const connectWallet = useCallback(async (id: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      if (!isSupportedStellarWalletId(id)) {
        throw new Error("Only Stellar-compatible wallets are supported.");
      }

      const { StellarWalletsKit } = await getStellarWalletKit();
      StellarWalletsKit.setWallet(id);
      StellarWalletsKit.setNetwork(STELLAR_CONFIG.network);

      let address: string;
      try {
        const access = await withTimeout(StellarWalletsKit.fetchAddress(), 60000);
        address = access.address;
      } catch (err: unknown) {
        throw new Error(
          getErrorMessage(err, "Failed to retrieve address. Please unlock your Stellar wallet and grant access.")
        );
      }

      await authenticateWallet(id, address);

      setWalletSession(address, id);
      const activeNetwork = await detectWalletNetwork();

      setState({
        publicKey: address,
        isConnected: true,
        isLoading: false,
        error: null,
        walletNetwork: activeNetwork ?? "TESTNET",
        walletId: id,
      });
      setModalOpen(false);
      toast.success("Wallet connected successfully!");

      try {
        if (typeof window !== "undefined") {
          import("posthog-js").then(({ default: ph }) => {
            if (ph && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
              ph.capture("wallet_connected", { wallet: address, walletId: id });
              ph.identify(address);
            }
          }).catch((err) => console.warn("PostHog wallet tracking failed:", err));
        }
      } catch (err) {
        console.warn("PostHog wallet tracking failed:", err);
      }

      return true;
    } catch (err: unknown) {
      const errMsg = getErrorMessage(err, "Failed to connect wallet");
      toast.error(`Connection Failed: ${errMsg}`);
      setState((s) => ({ ...s, isLoading: false, error: errMsg }));
      setModalOpen(false);
      return false;
    }
  }, [authenticateWallet, detectWalletNetwork]);

  const disconnectWallet = useCallback(async () => {
    try {
      const { StellarWalletsKit } = await getStellarWalletKit();
      await StellarWalletsKit.disconnect();
    } catch (err) {
      console.warn("Wallet disconnect cleanup failed:", err);
    }

    clearWalletSession();
    setState({ ...DEFAULT_STATE, isLoading: false });

    try {
      if (typeof window !== "undefined") {
        import("posthog-js").then(({ default: ph }) => {
          if (ph) ph.reset();
        }).catch((err) => console.warn("PostHog reset failed:", err));
      }
    } catch (err) {
      console.warn("PostHog reset failed:", err);
    }
  }, []);

  const sign = useCallback(async (xdr: string) => {
    if (!state.publicKey) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }

    const walletId = state.walletId ?? getWalletId() ?? DEFAULT_WALLET_ID;

    try {
      const { StellarWalletsKit } = await getStellarWalletKit();
      StellarWalletsKit.setWallet(walletId);
      StellarWalletsKit.setNetwork(STELLAR_CONFIG.network);

      if (walletId === STELLAR_WALLET_IDS.freighter) {
        const { getAddress } = await import("@stellar/freighter-api");
        const activeAddrRes = await getAddress();
        if (activeAddrRes.address && activeAddrRes.address !== state.publicKey) {
          const activeShort = shortenAddress(activeAddrRes.address);
          const stateShort = shortenAddress(state.publicKey);
          toast.error(`Freighter account mismatch: Active wallet is ${activeShort}, but website is connected as ${stateShort}. Please switch accounts in Freighter.`);
          throw new Error(`Freighter account mismatch: ${activeShort} vs ${stateShort}`);
        }
      }

      const signResult = await withTimeout(
        StellarWalletsKit.signTransaction(xdr, {
          networkPassphrase: STELLAR_CONFIG.network,
          address: state.publicKey,
        }),
        60000
      );

      if (!signResult.signedTxXdr) {
        throw new Error("Transaction signature empty");
      }

      return signResult.signedTxXdr;
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "User rejected the request");
      toast.error(`Signature Failed: ${msg}`);
      throw err;
    }
  }, [state.publicKey, state.walletId]);

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
