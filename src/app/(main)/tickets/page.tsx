import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { TicketTable } from "@/components/TicketTable";
import { TicketFilters } from "@/components/TicketFilters";
import { PRIORITY_ORDER } from "@/lib/permissions";
import type { Category, Priority, Status } from "@/lib/domain-types";
import Link from "next/link";
import { Plus } from "lucide-react";

const TICKET_SELECT = {
  id: true,
  seq: true,
  title: true,
  status: true,
  priority: true,
  category: true,
  createdAt: true,
  createdBy: { select: { name: true } },
  assignedTo: { select: { name: true } },
} as const;

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { status, priority, category, assignedTo, search, sort } = searchParams;

  const where: Record<string, unknown> = {};

  if (session.role === "TECHNICAL") {
    where.assignedToId = session.userId;
  } else if (session.role === "EMPLOYEE") {
    where.createdById = session.userId;
  }

  const totalTickets = await db.ticket.count({ where });
  const openTickets = await db.ticket.count({
    where: {
      ...where,
      status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] },
    },
  });

  if (status) where.status = status as Status;
  if (priority) where.priority = priority as Priority;
  if (category) where.category = category as Category;
  if (search) where.title = { contains: search, mode: "insensitive" };

  if (session.role === "MANAGER" && assignedTo) {
    where.assignedToId = assignedTo === "unassigned" ? null : assignedTo;
  }

  let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  if (sort === "date_asc") orderBy = { createdAt: "asc" };
  if (sort === "status") orderBy = { status: "asc" };

  let tickets = await db.ticket.findMany({
    where,
    select: TICKET_SELECT,
    orderBy,
  });

  if (sort === "priority") {
    tickets = [...tickets].sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    );
  }

  const technicalUsers =
    session.role === "MANAGER"
      ? await db.user.findMany({
        where: { role: "TECHNICAL" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
      : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Tickets</h1>
          <p className="page-subtitle">
            {totalTickets} total · {openTickets} active
          </p>
        </div>
        <Link href="/tickets/create" className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          New Ticket
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="h-10 rounded-xl bg-surface-elevated animate-pulse mb-4" />
        }
      >
        <TicketFilters
          technicalUsers={technicalUsers}
          showAssignedFilter={session.role === "MANAGER"}
        />
      </Suspense>

      <TicketTable tickets={tickets} />
    </div>
  );
}
