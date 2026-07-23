import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function ticketNumber(seq: number): string {
  return `TKT-${String(seq).padStart(3, "0")}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const CATEGORY_LABELS: Record<string, string> = {
  IT_SUPPORT: "IT Support",
  FACILITIES: "Facilities",
  HR: "HR",
  OTHER: "Other",
};

export const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-slate-100 text-slate-700 border-slate-300",
  ASSIGNED: "bg-blue-100 text-blue-700 border-blue-300",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-300",
  RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-300",
  CLOSED: "bg-gray-200 text-gray-600 border-gray-300",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600 border-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-300",
  HIGH: "bg-orange-100 text-orange-700 border-orange-300",
  CRITICAL: "bg-red-100 text-red-700 border-red-300",
};
