"use client";

import { LandingNav } from "@/components/layout/LandingNav";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/animations/Reveal";
import { m, useScroll, useTransform } from 'framer-motion';
import { useRef } from "react";
import { Timer, Coins, CircleDollarSign, Code2, Globe } from "lucide-react";

export default function NetworkPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <div className="min-h-screen bg-bg-void font-body-base text-ink-primary overflow-hidden">
      <LandingNav />

      <main className="pt-32 pb-32 max-w-7xl mx-auto px-4 md:px-margin-desktop">
        <Reveal>
          <div className="mb-8 font-mono-data text-xs uppercase tracking-widest text-ink-tertiary">
            <span className="text-accent font-bold">Stellar & Soroban</span>
          </div>
          <h1 className="font-headline-lg text-[48px] md:text-[64px] font-bold leading-none tracking-tighter mb-8 text-ink-primary max-w-4xl uppercase">
            Engineered for global finance.
          </h1>
          <p className="font-ui-label text-xl text-ink-secondary mb-16 leading-relaxed max-w-2xl">
            We built TrustLance on the Stellar network because it was designed specifically for cross-border payments, high throughput, and rock-bottom fees.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-20" ref={containerRef}>
          {/* Metrics */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {[
              { label: "Average Settlement Time", value: "< 5.0 sec", icon: Timer },
              { label: "Transaction Fee", value: "~$0.001 USD", icon: Coins },
              { label: "Base Currency", value: "USDC (Circle)", icon: CircleDollarSign },
              { label: "Smart Contracts", value: "Soroban (WASM)", icon: Code2 },
            ].map((metric, i) => {
              const Icon = metric.icon;
              return (
              <Reveal key={metric.label} delay={i * 0.1}>
                <div className="flex items-center gap-6 p-6 border-2 border-edge-neutral bg-bg-base shadow-neopop group hover:-translate-y-1 transition-transform relative">
                  <div className="absolute top-0 right-0 w-4 h-4 border-l-2 border-b-2 border-edge-neutral bg-bg-void" />
                  <div className="w-14 h-14 border-2 border-edge-neutral bg-bg-void flex items-center justify-center shrink-0 group-hover:border-accent transition-colors">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-mono-data text-xs uppercase tracking-widest font-bold text-ink-tertiary mb-1 group-hover:text-ink-secondary transition-colors">{metric.label}</p>
                    <p className="font-headline-lg text-2xl font-bold uppercase tracking-tight text-ink-primary">{metric.value}</p>
                  </div>
                </div>
              </Reveal>
              );
            })}
          </div>

          {/* Visual abstract node */}
          <div className="lg:col-span-7 h-[500px] border-2 border-edge-neutral bg-bg-base shadow-neopop relative overflow-hidden flex items-center justify-center">
            <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-edge-neutral bg-bg-void z-20" />
            
            {/* Grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,var(--color-edge-neutral)_2px,transparent_2px)] bg-[size:40px_40px] opacity-20" />
            
            <m.div style={{ y }} className="relative z-10 w-full max-w-sm">
              <div className="w-full aspect-square border-[4px] border-dashed border-accent/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_20s_linear_infinite]" />
              <div className="w-3/4 aspect-square border-[2px] border-accent/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_15s_linear_infinite_reverse]" />
              <div className="w-1/2 aspect-square bg-accent/5 border-2 border-accent/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 backdrop-blur-sm" />
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center bg-bg-base border-2 border-edge-neutral p-4 shadow-neopop">
                <Globe className="w-12 h-12 text-accent mb-2 animate-pulse" />
                <span className="font-mono-data text-xs text-ink-primary font-bold tracking-widest uppercase">STELLAR_NETWORK</span>
              </div>
            </m.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
