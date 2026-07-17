"use client";

import { useCallback, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { buildTrustlineTransaction } from "@/lib/stellar/swap";
import { submitHorizonTransaction } from "@/lib/stellar/utils";
import { STELLAR_CONFIG } from "@/constants/stellar";
import { toast } from "sonner";

export function useAddUsdcTrustline() {
  const { isConnected, publicKey, sign } = useWallet();
  const [isAdding, setIsAdding] = useState(false);

  const addTrustline = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !publicKey) {
      toast.error("Wallet not connected");
      return false;
    }
    setIsAdding(true);
    const toastId = toast.loading("Building trustline transaction...");
    try {
      const xdr = await buildTrustlineTransaction({
        publicKey,
        assetCode: STELLAR_CONFIG.usdc.code,
        assetIssuer: STELLAR_CONFIG.usdc.issuer,
      });
      toast.loading("Waiting for wallet signature...", { id: toastId });
      const signedXdr = await sign(xdr);
      toast.loading("Submitting trustline to network...", { id: toastId });
      await submitHorizonTransaction(signedXdr);
      toast.success("USDC trustline added!", { id: toastId });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add trustline";
      toast.error(`Trustline Failed: ${msg}`, { id: toastId });
      return false;
    } finally {
      setIsAdding(false);
    }
  }, [isConnected, publicKey, sign]);

  return { addTrustline, isAdding };
}
