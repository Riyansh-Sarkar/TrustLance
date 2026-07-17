"use client";

import { LandingNav } from "@/components/layout/LandingNav";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/animations/Reveal";
import { Wallet, CheckCircle2, CheckSquare } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-bg-void font-body-base text-ink-primary overflow-hidden">
      <LandingNav />

      <main className="pt-32 pb-32 max-w-7xl mx-auto px-4 md:px-margin-desktop">
        <Reveal>
          <div className="mb-8 font-mono-data text-xs uppercase tracking-widest text-ink-tertiary">
            <span className="text-accent font-bold">Core Mechanics</span>
          </div>
          <h1 className="font-headline-lg text-[48px] md:text-[64px] font-bold leading-none tracking-tighter mb-8 text-ink-primary max-w-4xl uppercase">
            Programmable Escrow & Verified Milestones
          </h1>
          <p className="font-ui-label text-xl text-ink-secondary mb-16 leading-relaxed max-w-2xl">
            TrustLance replaces trust with cryptography. By locking funds in a Soroban smart contract, we eliminate counterparty risk for both the freelancer and the client.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-20">
          <Reveal delay={0.1}>
            <div className="bg-bg-base border-2 border-edge-neutral shadow-neopop p-10 h-full relative group hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-edge-neutral bg-bg-void" />
              
              <div className="w-16 h-16 bg-bg-void border-2 border-edge-neutral flex items-center justify-center mb-8 text-accent">
                <Wallet className="w-8 h-8" />
              </div>
              <h3 className="font-headline-lg text-3xl font-bold uppercase tracking-tight text-ink-primary mb-6">Trustless Escrow</h3>
              <p className="font-mono-data text-sm text-ink-secondary leading-relaxed mb-8">
                When a contract is initialized, the client deposits the total project value in USDC into a dedicated Soroban smart contract. 
              </p>
              <ul className="space-y-6 border-t-2 border-dashed border-edge-neutral pt-8">
                {[
                  "Funds are cryptographically locked on the Stellar network.",
                  "Clients cannot withdraw funds unilaterally once locked.",
                  "Freelancers see proof of funds before writing a single line of code."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <CheckSquare className="w-5 h-5 text-accent mt-0.5" />
                    <span className="font-ui-label text-sm text-ink-primary font-bold">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="bg-bg-base border-2 border-edge-neutral shadow-neopop p-10 h-full relative group hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-edge-neutral bg-bg-void" />
              
              <div className="w-16 h-16 bg-bg-void border-2 border-edge-neutral flex items-center justify-center mb-8 text-accent">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-headline-lg text-3xl font-bold uppercase tracking-tight text-ink-primary mb-6">Milestone Triggers</h3>
              <p className="font-mono-data text-sm text-ink-secondary leading-relaxed mb-8">
                Payments are fractured into logical milestones. When a milestone is completed and approved, the smart contract automatically releases the exact fraction of USDC to the freelancer.
              </p>
              <ul className="space-y-6 border-t-2 border-dashed border-edge-neutral pt-8">
                {[
                  "Immediate settlement to the freelancer's Stellar wallet.",
                  "No intermediary holds or bank transfer delays.",
                  "Immutable on-chain record of every approval and release."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <CheckSquare className="w-5 h-5 text-accent mt-0.5" />
                    <span className="font-ui-label text-sm text-ink-primary font-bold">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
