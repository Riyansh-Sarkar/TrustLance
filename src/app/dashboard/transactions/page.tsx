"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText,
  Briefcase,
  User,
  Activity
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { getUserContracts } from "@/lib/firebase/contracts";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { Contract } from "@/types";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { horizonServer } from "@/lib/stellar/client";
import { TransactionBuilder, scValToNative, StrKey } from "@stellar/stellar-sdk";
import { STELLAR_CONFIG } from "@/constants/stellar";

// Utility to convert hex string to Uint8Array safely in browser context
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.substring(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export interface TransactionDetails {
  id: string;
  type: 'Escrow Deposit' | 'Milestone Payment Release' | 'Refund' | 'Contract Funding' | 'Payment Received' | 'Payment Sent' | 'Contract Created' | 'Contract Completed' | 'Escrow Closed' | 'Soroban Invocation';
  txHash: string;
  contractId: string;
  projectId: string;
  contractTitle: string;
  jobTitle: string;
  milestoneName?: string;
  senderWallet: string;
  receiverWallet: string;
  amount: number;
  network: string;
  status: 'Confirmed' | 'Failed' | 'Pending';
  timestamp: string;
  fee: number;
  isIncoming: boolean;
}

export default function TransactionsPage() {
  const { isConnected, publicKey } = useWallet();
  
  const [transactions, setTransactions] = useState<TransactionDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userContracts, setUserContracts] = useState<Contract[]>([]);
  
  // Search, Filter, Sort and Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Detail Modal State
  const [selectedTx, setSelectedTx] = useState<TransactionDetails | null>(null);

  // Decode Soroban transactions safely
  const decodeTransaction = useCallback((tx: any, contracts: Contract[], userKey: string): TransactionDetails | null => {
    try {
      const decoded = TransactionBuilder.fromXDR(tx.envelope_xdr, STELLAR_CONFIG.network);
      
      // Look for Soroban invokeHostFunction operation
      const op = decoded.operations.find(o => o.type === "invokeHostFunction") as any;
      
      if (op && op.func?.arm() === "invokeContract") {
        const invokeContract = op.func.value();
        const contractIdHex = invokeContract.contractAddress()?.contractId()?.toString("hex");
        if (!contractIdHex) return null;
        const contractId = StrKey.encodeContract(hexToBytes(contractIdHex) as any);

        const functionName = invokeContract.functionName()?.toString();
        const args = invokeContract.args();
        if (!args || args.length === 0) return null;

        const projectId = scValToNative(args[0]) as string;
        const contract = contracts.find(c => c.id === projectId);
        
        const contractTitle = contract?.title || "TrustLance Project";
        const jobTitle = contract?.title || "Milestone Agreement";
        
        let type: TransactionDetails['type'] = 'Soroban Invocation';
        let amount = 0;
        let senderWallet = tx.source_account || "";
        let receiverWallet = contractId;
        let milestoneName = "";
        let isIncoming = false;

        if (functionName === "initialize") {
          type = "Contract Funding";
          amount = contract ? Number(contract.totalAmount) : 0;
          senderWallet = contract?.clientWallet || senderWallet;
          receiverWallet = contractId;
          isIncoming = (contract?.freelancerWallet === userKey);
        } else if (functionName === "submit_milestone") {
          type = "Contract Created"; // Milestone work uploaded
          const milestoneIndex = Number(scValToNative(args[1]));
          const milestone = contract?.milestones?.[milestoneIndex];
          amount = milestone ? Number(milestone.amount) : 0;
          milestoneName = milestone ? milestone.description : `Milestone #${milestoneIndex + 1}`;
          senderWallet = contract?.freelancerWallet || senderWallet;
          receiverWallet = contractId;
          isIncoming = (contract?.clientWallet === userKey);
        } else if (functionName === "approve_milestone") {
          type = "Milestone Payment Release";
          const milestoneIndex = Number(scValToNative(args[1]));
          const milestone = contract?.milestones?.[milestoneIndex];
          amount = milestone ? Number(milestone.amount) : 0;
          milestoneName = milestone ? milestone.description : `Milestone #${milestoneIndex + 1}`;
          senderWallet = contractId;
          receiverWallet = contract?.freelancerWallet || "";
          isIncoming = (contract?.freelancerWallet === userKey);
        } else if (functionName === "flag_dispute") {
          type = "Soroban Invocation"; // dispute
          amount = contract ? Number(contract.totalAmount) : 0;
          senderWallet = contract?.clientWallet || senderWallet;
          receiverWallet = contractId;
        } else if (functionName === "resolve_dispute") {
          type = "Refund";
          // args[3] is amount in stroops
          amount = args[3] ? Number(scValToNative(args[3])) / 10000000 : 0;
          senderWallet = contractId;
          receiverWallet = args[2] ? String(scValToNative(args[2])) : "";
          isIncoming = (receiverWallet === userKey);
        } else if (functionName === "cancel_contract") {
          type = "Refund";
          amount = contract ? Number(contract.totalAmount) : 0;
          senderWallet = contractId;
          receiverWallet = contract?.clientWallet || "";
          isIncoming = (receiverWallet === userKey);
        }

        return {
          id: tx.hash,
          type,
          txHash: tx.hash,
          contractId,
          projectId,
          contractTitle,
          jobTitle,
          milestoneName,
          senderWallet,
          receiverWallet,
          amount,
          network: "Testnet",
          status: tx.successful ? "Confirmed" : "Failed",
          timestamp: tx.created_at,
          fee: Number(tx.fee_charged) / 10000000,
          isIncoming
        };
      }

      // Handle standard Stellar payments as fallback
      const paymentOp = decoded.operations.find(o => o.type === "payment") as any;
      if (paymentOp) {
        const isUsdc = paymentOp.asset?.code === "USDC";
        const isIncoming = paymentOp.destination === userKey;
        return {
          id: tx.hash,
          type: isIncoming ? "Payment Received" : "Payment Sent",
          txHash: tx.hash,
          contractId: "",
          projectId: "",
          contractTitle: isUsdc ? "USDC Payment Transfer" : "Stellar native XLM Transfer",
          jobTitle: "Direct Transfer",
          senderWallet: tx.source_account,
          receiverWallet: paymentOp.destination,
          amount: Number(paymentOp.amount),
          network: "Testnet",
          status: tx.successful ? "Confirmed" : "Failed",
          timestamp: tx.created_at,
          fee: Number(tx.fee_charged) / 10000000,
          isIncoming
        };
      }
    } catch (err) {
      console.warn("Failed to decode transaction operations:", tx.hash, err);
    }
    return null;
  }, []);

  const loadData = useCallback(async () => {
    if (!isConnected || !publicKey) return;
    setIsLoading(true);
    
    try {
      // 1. Fetch user contracts from Firestore
      const contractsData = await getUserContracts(publicKey);
      setUserContracts(contractsData);

      // 2. Fetch direct transactions from Horizon for the connected account
      let horizonTxs: any[] = [];
      try {
        const page = await horizonServer.transactions().forAccount(publicKey).order("desc").limit(40).call();
        horizonTxs = page.records;
      } catch (err) {
        console.warn("Horizon account transactions fetch failed:", err);
      }

      // 3. Query Firestore transaction events logged for contracts associated with this user
      const localEvents: any[] = [];
      try {
        const q = query(collection(db, "growth_tx_events"), where("walletAddress", "==", publicKey));
        const snap = await getDocs(q);
        snap.forEach((doc) => {
          localEvents.push({ id: doc.id, ...doc.data() });
        });
      } catch (err) {
        console.warn("Firestore growth events fetch failed:", err);
      }

      // 4. Extract any additional transaction hashes from Firestore events not loaded from Horizon
      const fetchedHashes = new Set(horizonTxs.map(tx => tx.hash));
      const missingHashes = localEvents
        .map(ev => ev.txHash)
        .filter(h => h && h !== "pending" && !fetchedHashes.has(h));

      // Fetch transaction objects for missing hashes in parallel
      if (missingHashes.length > 0) {
        const additionalPromises = missingHashes.slice(0, 15).map(async (hash) => {
          try {
            return await horizonServer.transactions().transaction(hash).call();
          } catch (e) {
            return null;
          }
        });
        const resolved = await Promise.all(additionalPromises);
        resolved.forEach(tx => {
          if (tx) horizonTxs.push(tx);
        });
      }

      // 5. Decode and format all transactions
      const parsedTransactions: TransactionDetails[] = [];
      horizonTxs.forEach(tx => {
        const decoded = decodeTransaction(tx, contractsData, publicKey);
        if (decoded) {
          // Verify that this user is a participant of this transaction
          const contract = contractsData.find(c => c.id === decoded.projectId);
          const isParticipant = 
            decoded.senderWallet === publicKey || 
            decoded.receiverWallet === publicKey || 
            (contract && (contract.clientWallet === publicKey || contract.freelancerWallet === publicKey));
          
          if (isParticipant) {
            parsedTransactions.push(decoded);
          }
        }
      });

      // Filter out duplicate transaction hashes
      const uniqueTxs = parsedTransactions.filter((v, i, a) => a.findIndex(t => t.txHash === v.txHash) === i);
      
      // Sort initially by timestamp (newest first)
      uniqueTxs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTransactions(uniqueTxs);
      
    } catch (err) {
      console.error("Failed to compile transaction history:", err);
      toast.error("Failed to load on-chain transaction history. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, publicKey, decodeTransaction]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Copy Transaction Hash
  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("Transaction hash copied to clipboard!");
  };

  // Export CSV statement
  const exportCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions available for export.");
      return;
    }

    const headers = [
      "Transaction Hash",
      "Type",
      "Contract Title",
      "Job Title",
      "Milestone Description",
      "Sender",
      "Receiver",
      "Amount (USDC)",
      "Status",
      "Gas/Fee (XLM)",
      "Created Date"
    ];

    const escapeCsv = (val: string) => {
      const sanitized = val.startsWith("=") || val.startsWith("+") || val.startsWith("-") || val.startsWith("@") ? `'${val}` : val;
      return `"${sanitized.replace(/"/g, '""')}"`;
    };

    const rows = filteredAndSortedTransactions.map(tx => [
      tx.txHash,
      tx.type,
      tx.contractTitle,
      tx.jobTitle,
      tx.milestoneName || "",
      tx.senderWallet,
      tx.receiverWallet,
      `${tx.isIncoming ? '+' : '-'}${tx.amount.toFixed(2)}`,
      tx.status,
      tx.fee.toFixed(6),
      new Date(tx.timestamp).toLocaleString()
    ].map(escapeCsv).join(","));

    const csvContent = [headers.map(escapeCsv).join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trustlance_statement_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV Statement exported successfully.");
  };

  // Filter & Sort Logic
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(tx => 
        tx.txHash.toLowerCase().includes(term) ||
        tx.contractId.toLowerCase().includes(term) ||
        tx.contractTitle.toLowerCase().includes(term) ||
        tx.jobTitle.toLowerCase().includes(term) ||
        (tx.milestoneName && tx.milestoneName.toLowerCase().includes(term)) ||
        tx.senderWallet.toLowerCase().includes(term) ||
        tx.receiverWallet.toLowerCase().includes(term)
      );
    }

    // Tab category filters
    if (activeFilter !== "all") {
      if (activeFilter === "deposits") {
        result = result.filter(tx => tx.type === "Contract Funding");
      } else if (activeFilter === "releases") {
        result = result.filter(tx => tx.type === "Milestone Payment Release");
      } else if (activeFilter === "refunds") {
        result = result.filter(tx => tx.type === "Refund");
      } else if (activeFilter === "payments") {
        result = result.filter(tx => tx.type === "Payment Received" || tx.type === "Payment Sent");
      } else if (activeFilter === "completed") {
        result = result.filter(tx => tx.status === "Confirmed");
      } else if (activeFilter === "pending") {
        result = result.filter(tx => tx.status === "Pending");
      } else if (activeFilter === "failed") {
        result = result.filter(tx => tx.status === "Failed");
      }
    }

    // Sort Logic
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else if (sortBy === "highest") {
      result.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === "lowest") {
      result.sort((a, b) => a.amount - b.amount);
    } else if (sortBy === "pending") {
      result.sort((a, b) => (b.status === "Pending" ? 1 : 0) - (a.status === "Pending" ? 1 : 0));
    } else if (sortBy === "completed") {
      result.sort((a, b) => (b.status === "Confirmed" ? 1 : 0) - (a.status === "Confirmed" ? 1 : 0));
    }

    return result;
  }, [transactions, searchTerm, activeFilter, sortBy]);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, sortBy]);

  // Pagination bounds
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTransactions.slice(start, start + itemsPerPage);
  }, [filteredAndSortedTransactions, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedTransactions.length / itemsPerPage));

  return (
    <ErrorBoundary>
      <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto bg-bg-void min-h-screen text-ink-primary">
        
        {/* Title Section */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-headline-lg text-4xl lg:text-5xl font-bold tracking-tight mb-3">Transactions</h1>
            <p className="text-ink-secondary font-ui-label text-sm md:text-base">
              Monitor and audit all escrow operations, funding events, and released milestone payments.
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-4 py-2.5 bg-bg-base border border-edge-neutral text-ink-secondary hover:text-ink-primary rounded-xl flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportCSV}
              disabled={transactions.length === 0}
              className="neopop-button-base px-4 py-2.5 font-ui-label font-medium text-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Statement
            </button>
          </div>
        </div>

        {/* Filters and Search Header */}
        <div className="bg-bg-base border border-edge-neutral rounded-[20px] shadow-sm p-6 lg:p-8 flex flex-col gap-6">
          
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center border-b border-edge-neutral pb-6">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-[11px] text-ink-tertiary w-4 h-4" />
              <input
                aria-label="Search transactions"
                className="w-full bg-bg-void border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl pl-12 pr-4 py-2.5 font-ui-label text-xs outline-none transition-all text-ink-primary placeholder:text-ink-tertiary"
                placeholder="Search by hash, project, milestone, or wallet address..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <span className="font-mono-data text-[10px] uppercase tracking-wider text-ink-secondary font-medium">Sort By:</span>
              <select
                aria-label="Sort transactions"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-bg-void border border-edge-neutral rounded-xl px-4 py-2.5 font-ui-label text-xs outline-none focus:border-accent transition-all text-ink-primary font-semibold"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

          </div>

          {/* Filtering Category Tabs */}
          <div className="flex gap-2 flex-wrap pb-4">
            {[
              { id: "all", label: "All" },
              { id: "deposits", label: "Escrow Deposits" },
              { id: "releases", label: "Milestone Releases" },
              { id: "refunds", label: "Refunds" },
              { id: "payments", label: "Direct Payments" },
              { id: "completed", label: "Completed" },
              { id: "pending", label: "Pending" },
              { id: "failed", label: "Failed" }
            ].map((tab) => (
              <button 
                type="button"
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2 font-ui-label text-xs uppercase tracking-wider font-semibold rounded-xl border transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? "bg-accent text-white border-accent shadow-sm"
                    : "bg-transparent text-ink-secondary border-edge-neutral hover:border-ink-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Transactions List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr>
                  <th className="py-4 px-3 font-mono-data text-[10px] uppercase tracking-wider text-ink-secondary font-medium w-1/4 border-b border-edge-neutral">Type / Contract</th>
                  <th className="py-4 px-3 font-mono-data text-[10px] uppercase tracking-wider text-ink-secondary font-medium w-1/4 border-b border-edge-neutral">Transaction Hash</th>
                  <th className="py-4 px-3 font-mono-data text-[10px] uppercase tracking-wider text-ink-secondary font-medium w-1/6 border-b border-edge-neutral">Date</th>
                  <th className="py-4 px-3 font-mono-data text-[10px] uppercase tracking-wider text-ink-secondary font-medium w-1/8 border-b border-edge-neutral text-center">Status</th>
                  <th className="py-4 px-3 font-mono-data text-[10px] uppercase tracking-wider text-ink-secondary font-medium w-1/6 text-right border-b border-edge-neutral">Amount (USDC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge-neutral bg-bg-base">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-ink-tertiary bg-bg-base">
                      <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-4 text-ink-secondary" />
                      <p className="font-mono-data text-xs uppercase tracking-wider font-semibold">Loading blockchain state...</p>
                    </td>
                  </tr>
                ) : paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 bg-bg-base">
                      <div className="max-w-md mx-auto text-center">
                        <div className="w-16 h-16 bg-bg-void border border-dashed border-edge-neutral rounded-[20px] flex items-center justify-center mx-auto mb-6">
                          <Activity className="w-6 h-6 text-ink-tertiary" />
                        </div>
                        <h3 className="text-lg font-ui-label font-bold text-ink-primary mb-2">No Transactions Found</h3>
                        <p className="text-xs font-ui-label text-ink-secondary leading-normal">
                          Your escrow and payment history will appear here once you start using TrustLance.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      className="group hover:bg-bg-void/40 transition-colors cursor-pointer bg-bg-base"
                    >
                      {/* Icon & Type */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 border border-edge-neutral rounded-xl flex items-center justify-center shrink-0 ${
                            tx.type.includes("Release") ? 'bg-accent/15 text-accent border-accent/20' :
                            tx.type.includes("Funding") || tx.type.includes("Deposit") ? 'bg-status-disputed/10 text-status-disputed border-status-disputed/15' :
                            'bg-bg-void text-ink-primary'
                          }`}>
                            {tx.type.includes("Release") || tx.type.includes("Received") ? <ArrowUpRight className="w-4 h-4" /> : 
                             tx.type.includes("Funding") || tx.type.includes("Sent") ? <ArrowDownLeft className="w-4 h-4" /> :
                             <Activity className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-ui-label font-bold text-xs uppercase tracking-wider text-ink-primary">{tx.type}</p>
                            <p className="font-ui-label text-[11px] text-ink-secondary truncate max-w-[200px] mt-0.5">{tx.contractTitle}</p>
                          </div>
                        </div>
                      </td>

                      {/* Hash shortener */}
                      <td className="py-4 px-3">
                        <p className="font-mono-data text-xs text-ink-secondary group-hover:text-ink-primary transition-colors">
                          {tx.txHash.substring(0, 12)}...{tx.txHash.substring(tx.txHash.length - 8)}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-3">
                        <p className="font-mono-data text-xs text-ink-secondary">
                          {new Date(tx.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </td>

                      {/* Status Badges */}
                      <td className="py-4 px-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          tx.status === "Confirmed" ? "bg-accent/10 border border-accent/30 text-accent" :
                          tx.status === "Failed" ? "bg-status-disputed/10 border border-status-disputed/30 text-status-disputed" :
                          "bg-bg-void border border-edge-neutral text-ink-secondary animate-pulse"
                        }`}>
                          {tx.status === "Confirmed" ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                           tx.status === "Failed" ? <XCircle className="w-3.5 h-3.5" /> :
                           <Clock className="w-3.5 h-3.5" />}
                          {tx.status}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-3 text-right">
                        <p className={`font-mono-data font-bold text-base tabular-nums ${
                          tx.isIncoming ? "text-accent" : "text-ink-primary"
                        }`}>
                          {tx.isIncoming ? "+" : "-"}{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredAndSortedTransactions.length > itemsPerPage && (
            <div className="flex justify-between items-center border-t border-edge-neutral pt-6 mt-4">
              <span className="font-mono-data text-xs text-ink-secondary font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-bg-void border border-edge-neutral text-ink-secondary hover:text-ink-primary disabled:opacity-40 rounded-xl transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-bg-void border border-edge-neutral text-ink-secondary hover:text-ink-primary disabled:opacity-40 rounded-xl transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Transaction Detail Modal */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-bg-base border border-edge-neutral rounded-[24px] max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedTx(null)}
                className="absolute top-6 right-6 p-1 rounded-xl hover:bg-bg-void text-ink-secondary hover:text-ink-primary transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="mb-8 border-b border-edge-neutral pb-6 pr-8">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-4 ${
                  selectedTx.status === "Confirmed" ? "bg-accent/10 border border-accent/30 text-accent" :
                  selectedTx.status === "Failed" ? "bg-status-disputed/10 border border-status-disputed/30 text-status-disputed" :
                  "bg-bg-void border border-edge-neutral text-ink-secondary"
                }`}>
                  {selectedTx.status === "Confirmed" ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                   selectedTx.status === "Failed" ? <XCircle className="w-3.5 h-3.5" /> :
                   <Clock className="w-3.5 h-3.5" />}
                  {selectedTx.status}
                </span>
                
                <h3 className="font-headline-lg text-2xl font-bold tracking-tight text-ink-primary mb-1">
                  {selectedTx.type}
                </h3>
                <p className="text-xs font-mono-data text-ink-secondary">
                  Blockchain verification receipt log
                </p>
              </div>

              {/* Details Content Grid */}
              <div className="space-y-6">
                
                {/* Hash */}
                <div className="bg-bg-void p-4 rounded-xl border border-edge-neutral flex justify-between items-center gap-4">
                  <div className="truncate flex-1">
                    <p className="font-ui-label text-[9px] uppercase tracking-wider text-ink-tertiary mb-1 font-semibold">Transaction Hash</p>
                    <p className="font-mono-data text-xs text-ink-primary truncate select-all">{selectedTx.txHash}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => copyToClipboard(selectedTx.txHash)}
                      className="p-2 bg-bg-base border border-edge-neutral text-ink-secondary hover:text-ink-primary rounded-lg transition-all cursor-pointer"
                      title="Copy Hash"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${selectedTx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-bg-base border border-edge-neutral text-ink-secondary hover:text-ink-primary rounded-lg transition-all flex items-center justify-center cursor-pointer"
                      title="View on Stellar Explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Info Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {selectedTx.projectId && (
                    <div className="border border-edge-neutral p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-ink-tertiary mb-2">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="font-ui-label text-[9px] uppercase tracking-wider font-semibold">Contract / Project</span>
                      </div>
                      <p className="font-ui-label font-bold text-xs text-ink-primary">{selectedTx.contractTitle}</p>
                      <p className="font-mono-data text-[10px] text-ink-secondary mt-1 break-all">{selectedTx.contractId || selectedTx.projectId}</p>
                    </div>
                  )}

                  {selectedTx.milestoneName && (
                    <div className="border border-edge-neutral p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-ink-tertiary mb-2">
                        <Briefcase className="w-4 h-4 shrink-0" />
                        <span className="font-ui-label text-[9px] uppercase tracking-wider font-semibold">Milestone / Scope</span>
                      </div>
                      <p className="font-ui-label font-bold text-xs text-ink-primary">{selectedTx.milestoneName}</p>
                      <p className="font-mono-data text-[10px] text-ink-secondary mt-1">{selectedTx.jobTitle}</p>
                    </div>
                  )}

                  <div className="border border-edge-neutral p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-ink-tertiary mb-2">
                      <User className="w-4 h-4 shrink-0" />
                      <span className="font-ui-label text-[9px] uppercase tracking-wider font-semibold">Sender Account</span>
                    </div>
                    <p className="font-mono-data text-[11px] text-ink-primary break-all select-all leading-normal">{selectedTx.senderWallet}</p>
                  </div>

                  <div className="border border-edge-neutral p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-ink-tertiary mb-2">
                      <User className="w-4 h-4 shrink-0" />
                      <span className="font-ui-label text-[9px] uppercase tracking-wider font-semibold">Recipient Account</span>
                    </div>
                    <p className="font-mono-data text-[11px] text-ink-primary break-all select-all leading-normal">{selectedTx.receiverWallet}</p>
                  </div>

                </div>

                {/* Pricing Details Breakdown */}
                <div className="bg-bg-void p-5 rounded-xl border border-edge-neutral space-y-4">
                  <h4 className="font-ui-label text-[10px] uppercase tracking-wider text-ink-secondary font-bold border-b border-edge-neutral pb-2">
                    Payment Breakdown
                  </h4>
                  <div className="flex justify-between items-center">
                    <span className="font-ui-label text-xs text-ink-secondary">Transaction Value</span>
                    <span className="font-mono-data text-xs text-ink-primary font-semibold">{selectedTx.amount.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-ui-label text-xs text-ink-secondary">Network Gas Fee</span>
                    <span className="font-mono-data text-xs text-ink-secondary">{selectedTx.fee.toFixed(6)} XLM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-ui-label text-xs text-ink-secondary">Network</span>
                    <span className="font-ui-label text-xs text-ink-primary font-bold uppercase tracking-wider">Stellar Testnet</span>
                  </div>
                  <div className="border-t border-edge-neutral pt-3 flex justify-between items-center font-bold">
                    <span className="font-ui-label text-xs text-ink-primary">Total Debited/Credited</span>
                    <span className={`font-mono-data text-sm sm:text-base tabular-nums ${
                      selectedTx.isIncoming ? "text-accent" : "text-ink-primary"
                    }`}>
                      {selectedTx.isIncoming ? "+" : "-"}{selectedTx.amount.toFixed(2)} USDC
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </ErrorBoundary>
  );
}
