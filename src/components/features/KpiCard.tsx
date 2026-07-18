"use client";

import { m } from 'framer-motion';
import { useCountUp } from "@/hooks/useCountUp";

const bgMap = { primary: "bg-accent/10", secondary: "bg-bg-interactive", tertiary: "bg-bg-interactive" };

export function KpiCard({
  label, value, unit, sub, subIcon, accent, delay,
}: {
  label: string;
  value: number;
  unit: string;
  sub: React.ReactNode;
  subIcon?: React.ReactNode;
  accent?: "primary" | "secondary" | "tertiary";
  delay?: number;
}) {
  const displayed = useCountUp(value);
  const accentBg = bgMap[accent ?? "primary"];

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: delay ?? 0 }}
      whileHover={{ y: -2 }}
      className="bg-bg-raised border border-edge-neutral rounded-[20px] p-6 cursor-default transition-all shadow-[0_1px_3px_rgba(0,0,0,0.01),0_8px_20px_-4px_rgba(0,0,0,0.02)]"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-ui-label text-ink-tertiary text-xs uppercase tracking-wider font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-full ${accentBg} flex items-center justify-center`}>
          {subIcon}
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="font-sans font-semibold text-kpi text-ink-primary tracking-tight">
          {displayed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="font-mono-data text-ink-secondary text-[11px] font-medium uppercase tracking-wider">{unit}</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs font-ui-label font-medium text-ink-secondary">
        {sub}
      </div>
    </m.div>
  );
}
