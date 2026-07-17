"use client";

import { useState } from "react";
import { m } from "framer-motion";
import Link from "next/link";
import { 
  ArrowRight, ShieldCheck, CheckCircle2, Lock, Wallet, 
  Code2, Terminal, Globe, Activity, FileCode, HelpCircle, 
  Check, ArrowUpRight, Search, Bell, Sparkles, ChevronDown
} from "lucide-react";

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does the milestone escrow work?",
      a: "TrustLance escrows contract funds in a decentralized Stellar smart contract. The client locks the total budget. As milestones are submitted and verified, funds are automatically routed to the contractor's wallet."
    },
    {
      q: "Are there any hidden platform fees?",
      a: "No. TrustLance charges a flat 1.5% protocol fee upon successful contract settlement. We do not charge subscription fees or tax your active development hours."
    },
    {
      q: "Is the contract code audited?",
      a: "Yes. Our Soroban-based smart contracts are open-source and have successfully passed security audits by leading blockchain security firms."
    },
    {
      q: "What wallets are supported?",
      a: "We support major Stellar wallets including Freighter, Albedo, and Rondo. You can connect your wallet in a single click."
    }
  ];

  return (
    <div className="landing-root bg-bg-void text-ink-primary font-body-base antialiased selection:bg-accent/20 selection:text-accent min-h-screen flex flex-col">
      
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-base/80 backdrop-blur-md border-b border-edge-neutral px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center max-w-7xl mx-auto rounded-b-[20px] shadow-sm">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-semibold text-lg tracking-tight flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-accent flex items-center justify-center text-white text-xs font-bold font-mono-data">T</span>
            <span>TrustLance</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-ink-secondary hover:text-ink-primary text-ui-label transition-colors">How it works</a>
            <a href="#features" className="text-ink-secondary hover:text-ink-primary text-ui-label transition-colors">Features</a>
            <a href="#preview" className="text-ink-secondary hover:text-ink-primary text-ui-label transition-colors">Dashboard</a>
            <a href="#pricing" className="text-ink-secondary hover:text-ink-primary text-ui-label transition-colors">Pricing</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth" className="text-ui-label text-ink-secondary hover:text-ink-primary transition-colors">
            Log in
          </Link>
          <Link href="/auth" className="neopop-button-teal text-ui-label px-5 py-2.5 rounded-xl font-medium">
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-margin-mobile md:px-margin-desktop flex flex-col items-center text-center max-w-5xl mx-auto relative overflow-hidden">
        {/* Decorative Grid & Glow */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none grid-bg" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none z-0" />

        <div className="relative z-10 space-y-6 max-w-3xl">
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-accent-glow border border-accent/20 rounded-full text-accent font-ui-label text-xs font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Milestones Live on Mainnet</span>
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-ink-primary leading-[1.1]"
          >
            Trust every <span className="text-accent">milestone.</span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-ink-secondary text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Decentralized milestone escrows for builders and clients. Secure payments, verifiable deliverables, and absolute certainty powered by Stellar.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Link href="/auth" className="neopop-button-teal px-8 py-3.5 text-sm font-medium flex items-center gap-2 shadow-lg">
              Start Freelancing <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth" className="neopop-button-base px-8 py-3.5 text-sm font-medium flex items-center gap-2 border border-edge-neutral bg-bg-base hover:bg-bg-overlay">
              <Wallet className="w-4 h-4" /> Connect Wallet
            </Link>
          </m.div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-8 border-y border-edge-neutral bg-bg-base/50">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink-primary font-mono-data tracking-widest text-sm">STELLAR</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink-primary font-mono-data tracking-widest text-sm">SOROBAN</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink-primary font-mono-data tracking-widest text-sm">USDC</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink-primary font-mono-data tracking-widest text-sm">FREIGHTER</span>
          </div>
        </div>
      </section>

      {/* Platform Preview Section */}
      <section id="preview" className="py-20 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto w-full">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink-primary">Built for modern collaboration.</h2>
          <p className="text-ink-secondary max-w-xl mx-auto">Explore the executive dashboard. Clear tracking of contracts, balances, and payouts.</p>
        </div>

        {/* Mockup Dashboard Card */}
        <m.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="card border border-edge-neutral bg-bg-base shadow-2xl rounded-[20px] overflow-hidden flex flex-col md:flex-row min-h-[600px]"
        >
          {/* Mock Sidebar */}
          <div className="w-full md:w-[220px] border-r border-edge-neutral bg-bg-void/50 p-6 flex flex-col gap-6 shrink-0">
            <div className="flex items-center gap-2 px-2">
              <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white text-[10px] font-bold font-mono-data">T</div>
              <span className="font-semibold text-sm">TrustLance</span>
            </div>
            <div className="space-y-1.5 flex-1">
              {["Overview", "Jobs", "Contracts", "Payments", "Analytics", "Settings"].map((lbl, idx) => (
                <div 
                  key={lbl} 
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${idx === 0 ? "text-accent bg-accent-glow border-l-2 border-accent" : "text-ink-secondary"}`}
                >
                  <div className="w-3.5 h-3.5 bg-current opacity-30 rounded-sm" />
                  <span>{lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mock Dashboard Body */}
          <div className="flex-1 p-6 md:p-10 space-y-8 bg-bg-base">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-xl text-ink-primary">Overview</h3>
                <p className="text-ink-secondary text-xs">Here is what is happening today.</p>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 bg-bg-overlay border border-edge-neutral rounded-xl text-xs font-medium text-ink-secondary">Deposit</div>
                <div className="px-3 py-1.5 bg-accent text-white rounded-xl text-xs font-medium shadow-sm">Withdraw</div>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { l: "Available Balance", v: "58.65 USDC", s: "Available to withdraw" },
                { l: "Escrowed Amount", v: "2,350.00 USDC", s: "Locked in contracts" },
                { l: "Pending Payouts", v: "850.00 USDC", s: "Est. arrival: 2 days" }
              ].map((card) => (
                <div key={card.l} className="p-5 border border-edge-neutral rounded-[20px] bg-bg-void/30 flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-ink-tertiary">{card.l}</span>
                  <span className="text-2xl font-bold text-ink-primary">{card.v}</span>
                  <span className="text-[10px] text-ink-secondary">{card.s}</span>
                </div>
              ))}
            </div>

            {/* Timelines and lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Timeline widget */}
              <div className="p-6 border border-edge-neutral rounded-[20px] space-y-4">
                <span className="text-[11px] font-bold tracking-wider text-ink-tertiary uppercase">Active Timeline</span>
                <div className="space-y-4 relative border-l border-edge-neutral pl-5 pt-2">
                  {[
                    { t: "Funding Escrow", d: "Client locks project balance.", s: "done" },
                    { t: "Development", d: "Freelancer submits milestone code.", s: "active" },
                    { t: "Verification & Release", d: "Client reviews and triggers payout.", s: "pending" }
                  ].map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[27px] top-0 w-3 h-3 rounded-full border-2 ${item.s === "done" ? "bg-accent border-accent" : item.s === "active" ? "bg-bg-base border-accent" : "bg-bg-base border-edge-neutral"}`} />
                      <h4 className="text-xs font-semibold text-ink-primary leading-none">{item.t}</h4>
                      <p className="text-[10px] text-ink-secondary mt-1">{item.d}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Actions */}
              <div className="p-6 border border-edge-neutral rounded-[20px] space-y-4">
                <span className="text-[11px] font-bold tracking-wider text-ink-tertiary uppercase">Recent Updates</span>
                <div className="space-y-3.5">
                  {[
                    { title: "Milestone Approved", desc: "USDC released for UX design.", time: "2m ago" },
                    { title: "Contract Finalized", desc: "Agreement signed with Client.", time: "1h ago" }
                  ].map((act, i) => (
                    <div key={i} className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-ink-primary">{act.title}</h4>
                        <p className="text-[10px] text-ink-secondary mt-0.5">{act.desc}</p>
                      </div>
                      <span className="text-[9px] text-ink-tertiary font-mono-data shrink-0">{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </m.div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-bg-base border-y border-edge-neutral">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink-primary">Four Steps. Zero Risk.</h2>
            <p className="text-ink-secondary max-w-xl mx-auto">Verifiable contracts that execute autonomously as work progresses.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { n: "01", t: "Agree & Define", d: "Set milestones, deliverables, and budgets. Create the contract in minutes." },
              { n: "02", t: "Escrow Budget", d: "Client funds are locked securely in the Soroban smart contract." },
              { n: "03", t: "Submit Milestones", d: "Contractor submits work. Verification logs are saved directly on-chain." },
              { n: "04", t: "Instant Payout", d: "Funds are released instantly to the contractor's wallet upon verification." }
            ].map((step) => (
              <div key={step.n} className="p-6 border border-edge-neutral rounded-[20px] bg-bg-void/40 flex flex-col justify-between h-48">
                <span className="font-mono-data text-accent font-bold text-lg">{step.n}</span>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-ink-primary">{step.t}</h3>
                  <p className="text-xs text-ink-secondary leading-normal">{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop w-full">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink-primary">Rigorous financial tooling.</h2>
          <p className="text-ink-secondary max-w-xl mx-auto">Optimized escrow and wallet integrations built for high-stakes freelancing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Lock,
              title: "Programmable Trust",
              desc: "Funds are locked cryptographically in audits-passed smart contracts. No escrow account or central vault required."
            },
            {
              icon: ShieldCheck,
              title: "Stellar Network Safety",
              desc: "Built on Stellar. Experience transaction speeds under 5 seconds with fees costing fractions of a cent."
            },
            {
              icon: Globe,
              title: "Cross-Border Liquidity",
              desc: "Get paid globally in USDC. Instantly swap, withdraw, or ramp funds using built-in fiat pathways."
            }
          ].map((feat, i) => (
            <div key={i} className="p-8 border border-edge-neutral bg-bg-base rounded-[20px] space-y-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-accent-glow border border-accent/20 flex items-center justify-center text-accent">
                <feat.icon className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-base text-ink-primary">{feat.title}</h3>
                <p className="text-xs text-ink-secondary leading-normal">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Developer API Section */}
      <section className="py-20 bg-bg-base border-y border-edge-neutral overflow-hidden">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-bg-overlay border border-edge-neutral rounded-full text-ink-secondary font-ui-label text-xs">
              <Terminal className="w-3.5 h-3.5" />
              <span>Developer SDK</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink-primary leading-tight">Integrate in minutes.</h2>
            <p className="text-ink-secondary text-sm leading-relaxed">
              Create contracts, fund escrows, and inspect milestones programmatically. Our simple Stellar API enables you to build custom client-freelancer integrations effortlessly.
            </p>
            <div className="flex gap-4">
              <Link href="/auth" className="neopop-button-teal px-6 py-3 text-xs font-medium">Read SDK Docs</Link>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#1e1e24] border border-edge-neutral rounded-[20px] p-6 shadow-2xl relative">
            <div className="absolute top-4 right-4 flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <pre className="font-mono-data text-xs text-accent-pressed leading-relaxed overflow-x-auto whitespace-pre pt-4">
              <code>{`// Initialize Contract & Lock Budget
const escrow = new TrustLanceContract({
  contractAddress: "0x8f...39a1",
  clientWallet: "GBLX...92A1",
  freelancerWallet: "GA2F...4P9Q"
});

await escrow.initialize({
  milestones: [
    { id: 0, amount: 15000, description: "Milestone 1" }
  ]
});

// Fund the escrow instantly
await escrow.deposit(USDC, 15000);`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop w-full">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink-primary">Flat-rate infrastructure.</h2>
          <p className="text-ink-secondary max-w-xl mx-auto">We don&apos;t tax your labor. Pay only upon successful completion.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Standard Escrow */}
          <div className="p-8 border border-edge-neutral bg-bg-base rounded-[20px] shadow-sm flex flex-col justify-between h-[360px]">
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-ink-tertiary">Standard Escrow</span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight text-ink-primary">1.5%</span>
                <span className="text-xs text-ink-secondary">per settled milestone</span>
              </div>
              <p className="text-xs text-ink-secondary leading-normal">Ideal for freelancers, contractors, and agencies working milestone-to-milestone.</p>
              <ul className="space-y-2 text-xs text-ink-secondary">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-accent" /> Unlimited contracts</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-accent" /> Custom milestone structures</li>
              </ul>
            </div>
            <Link href="/auth" className="w-full neopop-button-base py-3 text-xs font-medium">Start Building</Link>
          </div>

          {/* Enterprise custom */}
          <div className="p-8 border border-accent bg-accent-glow/20 rounded-[20px] shadow-sm flex flex-col justify-between h-[360px] relative overflow-hidden">
            <div className="absolute top-4 right-4 px-2 py-0.5 bg-accent text-white font-mono-data text-[9px] font-bold uppercase rounded-md">High Volume</div>
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-accent">Custom Treasury</span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight text-accent">0.5%</span>
                <span className="text-xs text-accent">custom scaling</span>
              </div>
              <p className="text-xs text-ink-secondary leading-normal">Optimized billing and zero platform overhead for high-volume enterprise operations.</p>
              <ul className="space-y-2 text-xs text-ink-secondary">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-accent" /> Dedicated account manager</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-accent" /> Priority API support</li>
              </ul>
            </div>
            <Link href="mailto:sales@trustlance.com" className="w-full neopop-button-teal py-3 text-xs font-medium">Contact Sales</Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-bg-base border-t border-edge-neutral">
        <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink-primary">Frequently Asked Questions</h2>
            <p className="text-ink-secondary text-sm">Have more questions? Get in touch with our team.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-edge-neutral rounded-[20px] bg-bg-void/40 overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left font-semibold text-sm text-ink-primary hover:bg-bg-overlay/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-ink-secondary transition-transform duration-350 ${activeFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-6 pt-1 text-xs text-ink-secondary leading-relaxed border-t border-edge-neutral/20 bg-bg-base">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bg-void border-t border-edge-neutral py-16 px-margin-mobile md:px-margin-desktop w-full mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-6 space-y-4">
            <Link href="/" className="font-semibold text-base tracking-tight flex items-center gap-2 text-ink-primary">
              <span className="w-5 h-5 rounded-md bg-accent flex items-center justify-center text-white text-xs font-bold font-mono-data">T</span>
              <span>TrustLance</span>
            </Link>
            <p className="text-xs text-ink-secondary max-w-sm leading-relaxed">
              Decentralized infrastructure for secure milestone escrows. Built on the speed and reliability of Stellar.
            </p>
            <p className="text-[10px] text-ink-tertiary font-mono-data">© 2026 TRUSTLANCE PROTOCOL. ALL RIGHTS RESERVED.</p>
          </div>
          <div className="md:col-span-6 flex justify-start md:justify-end gap-16">
            <div className="flex flex-col gap-3">
              <span className="font-mono-data text-[10px] text-ink-tertiary uppercase tracking-widest border-b border-edge-neutral pb-1">Product</span>
              <a href="#how-it-works" className="text-xs text-ink-secondary hover:text-accent transition-colors">How it works</a>
              <a href="#features" className="text-xs text-ink-secondary hover:text-accent transition-colors">Features</a>
              <a href="#pricing" className="text-xs text-ink-secondary hover:text-accent transition-colors">Pricing</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-mono-data text-[10px] text-ink-tertiary uppercase tracking-widest border-b border-edge-neutral pb-1">Legal</span>
              <Link href="/terms" className="text-xs text-ink-secondary hover:text-accent transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="text-xs text-ink-secondary hover:text-accent transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
