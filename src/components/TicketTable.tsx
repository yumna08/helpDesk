import Link from "next/link";
import { StatusBadge, PriorityBadge, CategoryBadge } from "@/components/Badges";
import { formatDate, ticketNumber } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export type TicketRow = {
  id: string;
  seq: number;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: Date;
  createdBy: { name: string };
  assignedTo: { name: string } | null;
};

export function TicketTable({ tickets }: { tickets: TicketRow[] }) {
  if (tickets.length === 0) {
    return (
      <div className="card border-dashed p-12 text-center text-sm text-text-secondary">
        No tickets found.
      </div>
    );
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("");

  return (
    <div className="card overflow-hidden">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-surface-elevated text-left text-[10px] font-bold uppercase tracking-widest text-muted">
          <tr>
            <th className="px-4 py-4 font-bold pl-6">ID</th>
            <th className="px-4 py-4">Title</th>
            <th className="px-4 py-4">Category</th>
            <th className="px-4 py-4">Priority</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-4 py-4">Assigned To</th>
            <th className="px-4 py-4">Created By</th>
            <th className="px-4 py-4">Date</th>
            <th className="px-4 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tickets.map((t) => (
            <tr
              key={t.id}
              className="hover:bg-surface-elevated/50 group transition-colors"
            >
              <td className="px-4 py-4 pl-6 whitespace-nowrap text-accent font-bold font-mono text-xs">
                {ticketNumber(t.seq)}
              </td>
              <td className="px-4 py-4">
                <div className="max-w-xs font-semibold text-white truncate">{t.title}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <CategoryBadge category={t.category} />
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <PriorityBadge priority={t.priority} />
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <StatusBadge status={t.status} />
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {t.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent text-black flex items-center justify-center text-[10px] font-bold">
                      {getInitials(t.assignedTo.name)}
                    </div>
                    <span className="text-white font-medium">
                      {t.assignedTo.name.split(" ")[0]}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted italic">Unassigned</span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-text-secondary font-medium">
                {t.createdBy.name.split(" ")[0]}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-muted text-xs">
                {formatDate(t.createdAt).split(",")[0]}
              </td>
              <td className="px-4 py-4 text-right pr-6">
                <Link
                  href={`/tickets/${t.id}`}
                  className="text-muted hover:text-accent transition-colors inline-flex items-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
