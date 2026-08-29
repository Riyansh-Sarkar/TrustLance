import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWalletAddress(address?: string | null) {
  if (!address) return "";
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}
