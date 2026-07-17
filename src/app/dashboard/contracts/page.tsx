/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { FileText, Plus, Search, Filter, ChevronRight, RefreshCw } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { getUserContracts } from "@/lib/firebase/contracts";
import type { Contract } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/providers/error-boundary";

type StatusFilter = "all" | "active" | "disputed" | "closed";

export default function ContractsPage() {
  const { isConnected, publicKey } = useWallet();
  const [state, setState] = useState<{contracts: Contract[], isLoading: boolean}>({
    contracts: [],
    isLoading: true
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    if (isConnected && publicKey) {
      getUserContracts(publicKey).then(data => {
        if (active) setState({ contracts: data, isLoading: false });
      }).catch(err => {
        console.error("Failed to load contracts", err);
        if (active) setState(prev => ({ ...prev, isLoading: false }));
      });
    } else {
      setState({ contracts: [], isLoading: false });
    }
    return () => { active = false; };
  }, [isConnected, publicKey]);

  const { contracts, isLoading } = state;

  const filteredContracts = useMemo(() => {
    let result = contracts;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term) ||
        c.clientWallet.toLowerCase().includes(term) ||
        c.freelancerWallet.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter(c => {
        const isCompleted = c.milestones && c.milestones.length > 0 && c.milestones.every(m => m.status === "released" || m.status === "approved");
        if (statusFilter === "active") return !c.isClosed && !c.isDisputed && !isCompleted;
        if (statusFilter === "disputed") return c.isDisputed;
        if (statusFilter === "closed") return c.isClosed || isCompleted;
        return true;
      });
    }
    return result;
  }, [contracts, searchTerm, statusFilter]);

  const statusLabels: Record<StatusFilter, string> = { all: "All", active: "Active", disputed: "Disputed", closed: "Closed" };

  return (
    <ErrorBoundary>
      <div className="p-8 lg:p-12 max-w-7xl mx-auto bg-bg-void min-h-screen text-ink-primary">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="font-headline-lg text-4xl lg:text-5xl font-bold tracking-tight mb-4">Contracts</h1>
            <p className="text-ink-secondary font-ui-label text-sm">Manage your active agreements and proposals.</p>
          </div>
          <div>
            <Link href="/dashboard/contracts/new" className="neopop-button-teal px-6 py-3 font-ui-label font-medium text-xs flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Contract
            </Link>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8 border-b border-edge-neutral pb-6 w-full">
          <div className="relative w-full sm:w-[400px]">
            <Search className="absolute left-4 top-3 text-ink-tertiary w-5 h-5" />
            <input
              aria-label="Search contracts"
              className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl pl-12 pr-4 py-2.5 font-ui-label text-sm outline-none transition-all text-ink-primary placeholder:text-ink-tertiary"
              placeholder="Search client, title, ID..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto relative">
            <button 
              type="button" 
              onClick={() => setIsFilterOpen(v => !v)} 
              className="w-full sm:w-48 px-4 py-2.5 bg-bg-base border border-edge-neutral hover:border-ink-secondary font-ui-label text-xs uppercase tracking-wider font-medium flex items-center justify-between rounded-xl transition-all cursor-pointer hover:shadow-sm"
            >
              <span>{statusLabels[statusFilter]}</span>
              <Filter className="w-4 h-4 text-ink-secondary" />
            </button>
            {isFilterOpen && (
              <div className="absolute top-full mt-2 right-0 w-full sm:w-48 bg-bg-raised border border-edge-neutral rounded-2xl shadow-xl z-20 overflow-hidden flex flex-col p-1">
                {(Object.keys(statusLabels) as StatusFilter[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setStatusFilter(key); setIsFilterOpen(false); }}
                    className={`px-4 py-2.5 text-left font-ui-label text-xs uppercase tracking-wider font-semibold rounded-xl hover:bg-bg-interactive transition-colors ${
                      statusFilter === key ? 'text-accent' : 'text-ink-secondary'
                    }`}
                  >
                    {statusLabels[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contracts List */}
        <div className="bg-bg-base border border-edge-neutral shadow-sm rounded-[20px] overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-bg-overlay/50 border-b border-edge-neutral">
              <tr>
                <th className="py-4 px-6 font-mono-data text-[10px] uppercase tracking-wider text-ink-secondary font-medium w-2/5">Contract Title</th>
                <th className="py-4 px-6 font-mono-data text-[10px] uppercase tracking-wider text-ink-secondary font-medium w-1/5">Counterparty</th>
                <th className="py-4 px-6 font-mono-data text-[10px] uppercase tracking-wider text-ink-secondary font-medium w-1/5">Value</th>
                <th className="py-4 px-6 font-mono-data text-[10px] uppercase tracking-wider text-ink-secondary font-medium w-1/5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge-neutral">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-ink-tertiary bg-bg-base">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-4 text-ink-secondary" />
                    <p className="font-mono-data text-xs uppercase tracking-wider font-medium">Loading Contracts...</p>
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 px-6 text-center bg-bg-base">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 bg-bg-void border border-dashed border-edge-neutral rounded-[20px] flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-6 h-6 text-ink-tertiary" />
                      </div>
                      <h3 className="font-ui-label text-base font-semibold text-ink-primary mb-2">No Contracts Found</h3>
                      <p className="font-ui-label text-ink-secondary text-xs mb-8">You don't have any active agreements or proposals yet.</p>
                      <Link href="/dashboard/contracts/new" className="neopop-button-base inline-flex px-8 py-3.5 font-ui-label font-medium text-xs items-center gap-2">
                        <Plus className="w-4 h-4" /> Create Contract
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContracts.map(contract => (
                  <tr 
                    key={contract.id} 
                    onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                    className="group hover:bg-bg-overlay/40 transition-colors cursor-pointer bg-bg-base"
                  >
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 border border-edge-neutral rounded-xl flex items-center justify-center shrink-0 group-hover:border-accent group-hover:bg-accent-glow transition-all">
                          <FileText className="text-ink-secondary group-hover:text-accent w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-ui-label text-sm font-semibold group-hover:text-accent transition-colors">{contract.title}</p>
                          <p className="font-mono-data text-[10px] text-ink-tertiary mt-1 uppercase tracking-wider font-medium">ID: {contract.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-bg-interactive text-ink-primary flex items-center justify-center font-semibold text-xs uppercase font-mono-data border border-edge-neutral">
                          {contract.freelancerWallet === publicKey ? "C" : "F"}
                        </div>
                        <span className="font-mono-data text-xs text-ink-secondary truncate w-24">
                          {contract.freelancerWallet === publicKey ? contract.clientWallet : contract.freelancerWallet}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-6 font-mono-data text-sm font-semibold text-ink-primary">
                      {Number(contract.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-ink-tertiary uppercase tracking-wider font-normal">USDC</span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border ${
                          contract.isClosed ? "border-edge-neutral text-ink-secondary bg-bg-interactive" :
                          contract.isDisputed ? "border-status-disputed/20 text-status-disputed bg-status-disputed/5" :
                          (contract.milestones && contract.milestones.length > 0 && contract.milestones.every(m => m.status === "released" || m.status === "approved")) ? "border-status-released/20 text-status-released bg-status-released/5" :
                          "border-accent/20 text-accent bg-accent-glow"
                        }`}>
                          {contract.isClosed ? "Closed" : 
                           contract.isDisputed ? "Disputed" : 
                           (contract.milestones && contract.milestones.length > 0 && contract.milestones.every(m => m.status === "released" || m.status === "approved")) ? "Completed" : 
                           "Active"}
                        </span>
                        <ChevronRight className="w-4 h-4 text-ink-tertiary group-hover:text-accent transition-colors" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ErrorBoundary>
  );
}
