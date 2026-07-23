import { ReactNode } from "react";
import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: string;
  trendColor?: string;
}

export function StatCard({
  label,
  value,
  icon,
  iconBg = "bg-accent-dim",
  iconColor = "text-accent",
  trend,
  trendColor = "text-accent-muted",
}: StatCardProps) {
  return (
    <div className="card p-5 relative overflow-hidden group hover:border-accent/20 transition-colors">
      <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-colors" />
      <div className="relative">
        <div className="flex items-start justify-between">
          {icon && (
            <div
              className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-4",
                iconBg,
                iconColor
              )}
            >
              {icon}
            </div>
          )}
          {trend && (
            <div className={clsx("text-xs font-semibold", trendColor)}>{trend}</div>
          )}
        </div>
        <div>
          <div className="text-3xl font-bold text-white mb-1">{value}</div>
          <div className="text-sm font-medium text-text-secondary">{label}</div>
        </div>
      </div>
    </div>
  );
}
