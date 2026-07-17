"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, User } from "lucide-react";
import { navItems } from "./navItems";

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-bg-base border-t border-edge-neutral flex md:hidden items-center justify-around z-40 px-2 pb-safe">
      {navItems.slice(0, 2).map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-accent" : "text-ink-secondary hover:text-ink-primary"}`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-ui-label font-medium">{item.label}</span>
          </Link>
        );
      })}
      <Link
        href="/dashboard/contracts/new"
        className="w-12 h-12 bg-accent rounded-full -mt-8 border-2 border-bg-base shadow-[0_4px_12px_rgba(16,185,129,0.2)] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all"
      >
        <Plus className="w-6 h-6" />
      </Link>
      {navItems.slice(2, 4).map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-accent" : "text-ink-secondary hover:text-ink-primary"}`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-ui-label font-medium">{item.label}</span>
          </Link>
        );
      })}
      <Link
        href="/dashboard/account"
        className={`flex flex-col items-center gap-1 transition-colors ${pathname?.startsWith("/dashboard/account") ? "text-accent" : "text-ink-secondary hover:text-ink-primary"}`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-ui-label font-medium">Account</span>
      </Link>
    </nav>
  );
}
