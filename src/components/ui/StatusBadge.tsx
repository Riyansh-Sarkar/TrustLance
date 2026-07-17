import { cn } from "@/lib/utils";

export type BadgeStatus = "In Progress" | "Scheduled" | "Funded" | "Pending" | "Completed" | "In Review";

const map: Record<string, string> = {
  "In Progress": "bg-secondary-container text-on-secondary-container border-secondary/30",
  Scheduled: "bg-surface-container-high text-on-surface-variant border-outline-variant",
  Funded: "bg-primary/10 text-primary border-primary/20",
  Pending: "bg-tertiary/10 text-tertiary border-tertiary/20",
  Completed: "bg-green-500/10 text-green-600 border-green-500/20",
  "In Review": "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

export function StatusBadge({ status, className }: { status: BadgeStatus, className?: string }) {
  return (
    <span className={cn(`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-data border ${map[status] ?? map.Scheduled}`, className)}>
      {status}
    </span>
  );
}
