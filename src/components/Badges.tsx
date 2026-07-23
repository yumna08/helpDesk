import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  cn,
} from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    ASSIGNED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    IN_PROGRESS: "bg-accent-dim text-accent border-accent/30",
    RESOLVED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    CLOSED: "bg-white/5 text-text-secondary border-border",
  };

  return (
    <span
      className={cn(
        "badge-pill border",
        styles[status] || "bg-white/5 text-text-secondary border-border"
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const dotColors: Record<string, string> = {
    LOW: "bg-muted",
    MEDIUM: "bg-amber-400",
    HIGH: "bg-orange-500",
    CRITICAL: "bg-red-500",
  };

  return (
    <span className="badge-pill border border-border bg-surface-elevated text-white">
      <span
        className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full",
          dotColors[priority] || "bg-muted"
        )}
      />
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    IT_SUPPORT: "bg-cyan-500/15 text-cyan-400",
    FACILITIES: "bg-rose-500/15 text-rose-400",
    HR: "bg-purple-500/15 text-purple-400",
    OTHER: "bg-accent-dim text-accent",
  };

  return (
    <span
      className={cn(
        "badge-pill",
        styles[category] || "bg-white/5 text-text-secondary"
      )}
    >
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}
