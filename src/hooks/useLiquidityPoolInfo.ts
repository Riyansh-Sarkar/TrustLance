/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Address, xdr } from "@stellar/stellar-sdk";
import { STELLAR_CONFIG } from "@/constants/stellar";
import { buildSorobanViewTx } from "@/lib/stellar/sorobanView";

export interface PoolState {
  reserveA: number;
  reserveB: number;
  totalLpShares: number;
  isInitialized: boolean;
}

function i128ScValToNumber(val: xdr.ScVal): number {
  const i128 = val.i128();
  if (!i128) return 0;
  const lo = BigInt(i128.lo().toString());
  const hi = BigInt(i128.hi().toString());
  const combined = (hi << 64n) | lo;
  return Number(combined);
}

function findFieldInMap(retval: xdr.ScVal, fieldName: string): xdr.ScVal | null {
  try {
    if (retval.switch().name !== "scvMap") return null;
    const entries = retval.map();
    if (!entries) return null;
    for (const entry of entries) {
      const key = entry.key();
      if (key.switch().name === "scvSymbol" && key.sym().toString() === fieldName) {
        return entry.val();
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function useLiquidityPoolInfo() {
  const [pool, setPool] = useState<PoolState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const ammId = STELLAR_CONFIG.ammContractId;
    if (!ammId) {
      setPool(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const addr = Address.fromString(ammId);
      const infoResult = await buildSorobanViewTx({
        contractAddress: addr,
        functionName: "get_info",
        args: [],
      });

      if (infoResult && "result" in infoResult && infoResult.result?.retval) {
        const retval = infoResult.result.retval;
        const ra = findFieldInMap(retval, "reserve_a");
        const rb = findFieldInMap(retval, "reserve_b");
        const lp = findFieldInMap(retval, "total_lp_shares");
        setPool({
          reserveA: ra ? i128ScValToNumber(ra) : 0,
          reserveB: rb ? i128ScValToNumber(rb) : 0,
          totalLpShares: lp ? i128ScValToNumber(lp) : 0,
          isInitialized: true,
        });
      } else {
        setPool({ reserveA: 0, reserveB: 0, totalLpShares: 0, isInitialized: false });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("LedgerEntryNotFound") ||
        msg.includes("EntryNotFound") ||
        msg.toLowerCase().includes("not found")
      ) {
        setPool({ reserveA: 0, reserveB: 0, totalLpShares: 0, isInitialized: false });
      } else {
        setError(msg);
        setPool(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { pool, isLoading, error, refresh };
}
