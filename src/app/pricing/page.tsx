"use client";

import { LandingNav } from "@/components/layout/LandingNav";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/animations/Reveal";
import Link from "next/link";
import { CheckSquare } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-bg-void font-body-base text-ink-primary overflow-hidden">
      <LandingNav />

      <main className="pt-32 pb-32 max-w-7xl mx-auto px-4 md:px-margin-desktop">
        <Reveal className="text-center mb-24">
          <div className="mb-8 font-mono-data text-xs uppercase tracking-widest text-ink-tertiary">
            <span className="text-accent font-bold">Simple Pricing</span>
          </div>
          <h1 className="font-headline-lg text-[48px] md:text-[64px] font-bold leading-none tracking-tighter mb-8 text-ink-primary max-w-4xl mx-auto uppercase">
            Zero hidden fees. <br /> Transparent by design.
          </h1>
          <p className="font-ui-label text-xl text-ink-secondary max-w-2xl mx-auto leading-relaxed">
            TrustLance is free for workers. Clients pay a flat 1% smart contract fee on project completion to cover network and protocol costs.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 items-start">
          {/* Freelancer Tier */}
          <Reveal delay={0.1}>
            <div className="bg-bg-base border-2 border-edge-neutral shadow-neopop p-10 h-full relative group">
              <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-edge-neutral bg-bg-void" />
              <h3 className="font-mono-data text-sm uppercase tracking-widest text-ink-secondary font-bold mb-8">Freelancer</h3>
              <div className="mb-8 flex items-baseline gap-2">
                <span className="font-headline-lg text-6xl font-bold uppercase tracking-tight text-ink-primary">$0</span>
                <span className="font-mono-data text-sm text-ink-tertiary uppercase tracking-widest">/ month</span>
              </div>
              <p className="font-ui-label text-sm text-ink-secondary font-bold mb-10 h-10 border-l-2 border-edge-neutral pl-4">
                You do the work, you get paid. Period.
              </p>
              
              <ul className="space-y-6 mb-12 border-t-2 border-dashed border-edge-neutral pt-8">
                {[
                  "No withdrawal fees",
                  "No monthly subscriptions",
                  "Create unlimited proposals",
                  "Instant Soroban settlement"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <CheckSquare className="w-5 h-5 text-accent mt-0.5" />
                    <span className="font-ui-label text-sm font-bold text-ink-primary">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/auth" className="block w-full text-center py-4 border-2 border-edge-neutral font-ui-label text-sm font-bold uppercase tracking-widest hover:border-ink-secondary transition-colors">
                Start Earning
              </Link>
            </div>
          </Reveal>

          {/* Client Tier */}
          <Reveal delay={0.2}>
            <div className="bg-bg-base border-[3px] border-accent shadow-[8px_8px_0px_var(--color-accent)] p-10 h-full relative group -translate-y-4">
              <div className="absolute top-0 right-0 w-8 h-8 border-l-[3px] border-b-[3px] border-accent bg-bg-void" />
              
              <h3 className="font-mono-data text-sm uppercase tracking-widest text-accent font-bold mb-8">Client / Agency</h3>
              <div className="mb-8 flex items-baseline gap-2">
                <span className="font-headline-lg text-6xl font-bold uppercase tracking-tight text-ink-primary">1%</span>
                <span className="font-mono-data text-sm text-ink-tertiary uppercase tracking-widest">fee</span>
              </div>
              <p className="font-ui-label text-sm text-ink-secondary font-bold mb-10 h-10 border-l-[3px] border-accent pl-4">
                A flat protocol fee applied when funding escrow.
              </p>
              
              <ul className="space-y-6 mb-12 border-t-[3px] border-dashed border-accent/50 pt-8">
                {[
                  "Secure smart contract escrow",
                  "Unlimited milestones",
                  "Dispute resolution framework",
                  "Exportable PDF invoices"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <CheckSquare className="w-5 h-5 text-accent mt-0.5" />
                    <span className="font-ui-label text-sm font-bold text-ink-primary">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/auth" className="neopop-button-teal block w-full text-center py-4 font-ui-label text-sm font-bold uppercase tracking-widest">
                Fund a Project
              </Link>
            </div>
          </Reveal>

          {/* Enterprise Tier */}
          <Reveal delay={0.3}>
            <div className="bg-bg-base border-2 border-edge-neutral shadow-neopop p-10 h-full relative group">
              <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-edge-neutral bg-bg-void" />
              <h3 className="font-mono-data text-sm uppercase tracking-widest text-ink-secondary font-bold mb-8">Enterprise</h3>
              <div className="mb-8 flex items-baseline gap-2">
                <span className="font-headline-lg text-4xl lg:text-5xl font-bold uppercase tracking-tight text-ink-primary pt-2">Custom</span>
              </div>
              <p className="font-ui-label text-sm text-ink-secondary font-bold mb-10 h-10 border-l-2 border-edge-neutral pl-4">
                High-volume platforms and marketplaces.
              </p>
              
              <ul className="space-y-6 mb-12 border-t-2 border-dashed border-edge-neutral pt-8">
                {[
                  "Custom fee structures",
                  "White-labeled UI",
                  "API access",
                  "Dedicated account manager"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <CheckSquare className="w-5 h-5 text-accent mt-0.5" />
                    <span className="font-ui-label text-sm font-bold text-ink-primary">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/auth" className="block w-full text-center py-4 border-2 border-edge-neutral font-ui-label text-sm font-bold uppercase tracking-widest hover:border-ink-secondary transition-colors">
                Contact Sales
              </Link>
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
