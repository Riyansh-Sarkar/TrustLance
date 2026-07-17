import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Shield, Lock, FileCode, Terminal, Code2, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full py-16 bg-bg-base border-t divider">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center">
              <Logo iconSize={28} textSize="text-lg" subTextSize="text-[8px]" />
            </div>
            <p className="text-ui-label text-ink-secondary max-w-xs leading-relaxed">
              Building the financial infrastructure for the decentralized workforce. Secure, programmable, and fast.
            </p>
            {/* Network badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-overlay border border-[var(--edge-neutral)] rounded-md w-fit shadow-[2px_2px_0px_0px_var(--edge-neutral)]">
              <span className="text-ui-label text-xs text-ink-primary font-bold tracking-wide">Powered by Stellar</span>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:col-span-2 md:justify-items-end">
            <div className="flex flex-col gap-4">
              <p className="font-mono-data text-[10px] uppercase text-ink-tertiary tracking-widest mb-1">Product</p>
              <Link href="/features" className="text-ui-label text-ink-secondary hover:text-ink-primary hover:underline decoration-accent underline-offset-4 transition-all">Features</Link>
              <Link href="/network" className="text-ui-label text-ink-secondary hover:text-ink-primary hover:underline decoration-accent underline-offset-4 transition-all">Network</Link>
              <Link href="/pricing" className="text-ui-label text-ink-secondary hover:text-ink-primary hover:underline decoration-accent underline-offset-4 transition-all">Pricing</Link>
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-mono-data text-[10px] uppercase text-ink-tertiary tracking-widest mb-1">Resources</p>
              {[
                { name: "Help Centre", href: "/help" },
                { name: "Documentation", href: "/docs" },
                { name: "Terms of Service", href: "/terms" },
                { name: "Privacy Policy", href: "/privacy" }
              ].map((link) => (
                <Link key={link.name} className="text-ui-label text-ink-secondary hover:text-ink-primary hover:underline decoration-accent underline-offset-4 transition-all" href={link.href}>
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-mono-data text-[10px] uppercase text-ink-tertiary tracking-widest mb-1">Security</p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: <Shield className="w-4 h-4 text-accent" />, label: "Audit Passed v2.1" },
                  { icon: <Lock className="w-4 h-4 text-accent" />, label: "Non-custodial" },
                  { icon: <FileCode className="w-4 h-4 text-accent" />, label: "Open Source" },
                ].map((badge) => (
                  <div key={badge.label} className="flex items-center gap-2 text-ui-label text-xs text-ink-secondary">
                    {badge.icon}
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 divider flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="font-mono-data text-[10px] text-ink-tertiary uppercase tracking-widest flex flex-col sm:flex-row gap-2 sm:gap-4 text-center sm:text-left items-center">
            <span>&copy; 2026 TrustLance &middot; Built on Stellar</span>
            <span className="hidden sm:inline opacity-50">|</span>
            <span>
              Designed & Built By{" "}
              <a href="https://www.coderedxbt.dev" target="_blank" rel="noopener noreferrer" className="hover:text-ink-primary transition-colors">
                Vinayak (codeRED)
              </a>
            </span>
          </div>
          <div className="flex items-center gap-4">
            {[<Terminal key="terminal" className="w-5 h-5"/>, <Code2 key="code" className="w-5 h-5"/>, <Globe key="globe" className="w-5 h-5"/>].map((icon, idx) => (
              <button type="button" key={idx} className="text-ink-tertiary hover:text-ink-primary transition-colors p-1">
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
