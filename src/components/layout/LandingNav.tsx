"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { m } from 'framer-motion';
import { Sun, Moon } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const getTheme = () => {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("theme");
  return stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
};

export function LandingNav() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isDarkMode = useSyncExternalStore(
    (callback) => {
      window.addEventListener("storage", callback);
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      mql.addEventListener("change", callback);
      return () => {
        window.removeEventListener("storage", callback);
        mql.removeEventListener("change", callback);
      };
    },
    getTheme,
    () => false
  );

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    window.dispatchEvent(new Event("storage"));
  };

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
            onClick={toggleDarkMode} 
            className="text-ink-secondary hover:text-ink-primary transition-colors"
          >
            {mounted ? (isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />) : <div className="w-5 h-5" />}
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
