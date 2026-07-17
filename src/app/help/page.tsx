"use client";

import React, { useState } from "react";
import { ChevronDown, MessageCircle, FileText, Search, ExternalLink } from "lucide-react";
import { DashboardTopNav } from "@/components/layout/DashboardTopNav";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

const FAQS = [
  {
    question: "How does the Stellar escrow work?",
    answer: "When a client creates a contract, the funds are deposited into a secure Stellar smart contract (Soroban). The funds remain locked and cannot be withdrawn by either party until the milestone is approved by the client, or a dispute resolution is reached."
  },
  {
    question: "What happens if there's a dispute?",
    answer: "If the client and freelancer cannot agree on the deliverables, either party can flag the contract for dispute. This locks the contract state. Our decentralized arbitration team will review the evidence and deliverables to make a final ruling."
  },
  {
    question: "Which networks are supported?",
    answer: "Currently, TrustLance is deployed on the Stellar Testnet for beta testing. Mainnet support will be rolling out soon. Please ensure your Freighter wallet is connected to the correct network."
  },
  {
    question: "How are fees calculated?",
    answer: "TrustLance charges a flat 1% fee on released funds. There are no fees for creating a contract or depositing funds. Standard Stellar network transaction fees (which are fractions of a cent) still apply."
  }
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-bg-void flex flex-col md:flex-row font-body-base">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <DashboardTopNav />
        <main className="flex-1 overflow-y-auto pt-24 pb-12 px-4 md:px-margin-desktop text-ink-primary">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-headline-lg font-bold uppercase tracking-tight text-ink-primary mb-4">
                Help Centre
              </h1>
              <p className="text-ink-secondary font-mono-data text-sm uppercase tracking-widest">
                How can we help you today?
              </p>
              
              <div className="relative max-w-xl mx-auto mt-12 group">
                <div className="absolute top-0 right-0 w-4 h-4 border-l-2 border-b-2 border-edge-neutral bg-bg-void z-10" />
                <Search className="absolute left-4 top-4 text-ink-secondary w-5 h-5" />
                <input
                  aria-label="Search help articles"
                  type="text"
                  placeholder="SEARCH ARTICLES, GUIDES, AND FAQS..."
                  className="w-full bg-bg-base border-2 border-edge-neutral pl-12 pr-4 py-4 font-mono-data text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-accent transition-colors text-ink-primary shadow-neopop group-hover:-translate-y-1 transition-transform"
                />
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
              <div className="bg-bg-base border-2 border-edge-neutral shadow-neopop p-8 relative group hover:-translate-y-1 transition-transform cursor-pointer">
                <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-edge-neutral bg-bg-void" />
                <div className="w-16 h-16 border-2 border-edge-neutral bg-bg-void flex items-center justify-center mb-8 group-hover:border-accent transition-colors text-accent">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-headline-lg text-2xl font-bold uppercase tracking-tight text-ink-primary mb-4">Documentation</h3>
                <p className="text-ink-secondary font-ui-label text-sm mb-8 leading-relaxed h-12">
                  Detailed guides on API integration, Soroban smart contracts, and platform features.
                </p>
                <div className="border-t-2 border-dashed border-edge-neutral pt-6 mt-auto">
                  <span className="text-accent font-mono-data text-sm uppercase tracking-widest font-bold flex items-center gap-2 group-hover:text-ink-primary transition-colors">
                    Read the docs <ExternalLink className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div className="bg-bg-base border-2 border-edge-neutral shadow-neopop p-8 relative group hover:-translate-y-1 transition-transform cursor-pointer">
                <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-edge-neutral bg-bg-void" />
                <div className="w-16 h-16 border-2 border-edge-neutral bg-bg-void flex items-center justify-center mb-8 group-hover:border-ink-secondary transition-colors text-ink-secondary">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="font-headline-lg text-2xl font-bold uppercase tracking-tight text-ink-primary mb-4">Contact Support</h3>
                <p className="text-ink-secondary font-ui-label text-sm mb-8 leading-relaxed h-12">
                  Can&apos;t find what you&apos;re looking for? Reach out to our dedicated support team.
                </p>
                <div className="border-t-2 border-dashed border-edge-neutral pt-6 mt-auto">
                  <span className="text-ink-secondary font-mono-data text-sm uppercase tracking-widest font-bold flex items-center gap-2 group-hover:text-ink-primary transition-colors">
                    Open a ticket <ExternalLink className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <h2 className="font-headline-lg text-3xl font-bold uppercase tracking-tight text-ink-primary mb-8 border-l-4 border-accent pl-4">Frequently Asked Questions</h2>
            <div className="bg-bg-base border-2 border-edge-neutral shadow-neopop">
              {FAQS.map((faq, idx) => (
                <div 
                  key={faq.question}
                  className={`border-b-2 border-edge-neutral last:border-b-0 ${openFaq === idx ? 'bg-bg-void' : ''}`}
                >
                  <button type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-8 py-6 flex items-center justify-between text-left focus:outline-none hover:bg-bg-void/50 transition-colors"
                  >
                    <span className="font-ui-label font-bold text-lg text-ink-primary uppercase tracking-widest pr-4">{faq.question}</span>
                    <div className={`w-8 h-8 border-2 border-edge-neutral flex items-center justify-center shrink-0 transition-transform bg-bg-base ${openFaq === idx ? 'rotate-180 border-accent text-accent' : 'text-ink-secondary'}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>
                  
                  <div 
                    className={`px-8 overflow-hidden transition-all duration-300 ease-in-out border-l-4 border-transparent ${
                      openFaq === idx ? 'max-h-48 pb-6 opacity-100 border-accent ml-8 mb-6' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-ink-secondary font-mono-data text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
