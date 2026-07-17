import { LayoutDashboard, FileText, Banknote, BarChart3, Briefcase } from "lucide-react";

export const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Jobs", icon: Briefcase, href: "/dashboard/jobs" },
  { label: "Contracts", icon: FileText, href: "/dashboard/contracts" },
  { label: "Payments", icon: Banknote, href: "/dashboard/payments" },
  { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
];
