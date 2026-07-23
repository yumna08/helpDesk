import Link from "next/link";
import { StatusBadge, PriorityBadge, CategoryBadge } from "@/components/Badges";
import { formatDate, ticketNumber } from "@/lib/utils";

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
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No tickets found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Ticket</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Assigned to</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tickets.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link
                  href={`/tickets/${t.id}`}
                  className="font-medium text-indigo-600 hover:underline"
                >
                  {ticketNumber(t.seq)}
                </Link>
                <div className="max-w-xs truncate text-slate-700">{t.title}</div>
              </td>
              <td className="px-4 py-3">
                <CategoryBadge category={t.category} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={t.priority} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={t.status} />
              </td>
              <td className="px-4 py-3 text-slate-600">
                {t.assignedTo?.name ?? <span className="text-slate-400">Unassigned</span>}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                {formatDate(t.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
