"use client";

import Link from "next/link";
import { m } from 'framer-motion';
import { Sun, Moon } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useDarkMode } from "@/hooks/useDarkMode";

export function LandingNav() {
  const { isDarkMode, toggleDarkMode, mounted } = useDarkMode();

  return (
    <nav className="w-full top-0 sticky z-50 bg-bg-void/90 backdrop-blur-md border-b divider">
      <div className="flex justify-between items-center h-16 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center"
        >
          <Link href="/" className="flex items-center">
            <Logo iconSize={32} textSize="text-xl" subTextSize="text-[8px]" />
          </Link>
        </m.div>

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="hidden md:flex gap-8 items-center"
        >
          <Link href="/features" className="text-ink-secondary hover:text-ink-primary text-ui-label transition-colors">
            Features
          </Link>
          <Link href="/network" className="text-ink-secondary hover:text-ink-primary text-ui-label transition-colors">
            Network
          </Link>
          <Link href="/pricing" className="text-ink-secondary hover:text-ink-primary text-ui-label transition-colors">
            Pricing
          </Link>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="flex items-center gap-6"
        >
          <button type="button" 
            aria-label="Toggle dark mode"
            onClick={toggleDarkMode} 
            className="p-2 text-ink-secondary hover:bg-bg-interactive hover:text-ink-primary transition-all rounded-full flex items-center justify-center w-9 h-9"
          >
            {mounted ? (isDarkMode ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-ink-secondary" />) : <div className="w-5 h-5" />}
          </button>
          <Link href="/auth" className="hidden sm:block text-ui-label text-ink-secondary hover:text-ink-primary transition-colors">
            Login
          </Link>
          <Link
            href="/auth"
            className="neopop-button-teal text-ui-label px-5 py-2.5 flex items-center justify-center font-bold"
          >
            Launch App
          </Link>
        </m.div>
      </div>
    </nav>
  );
}
