import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { TicketTable } from "@/components/TicketTable";
import { TicketFilters } from "@/components/TicketFilters";
import { PRIORITY_ORDER } from "@/lib/permissions";
import type { Category, Priority, Status } from "@prisma/client";

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

  // Role-based scoping: this mirrors dashboard scope so the ticket list
  // never leaks tickets a role shouldn't see, regardless of filters applied.
  if (session.role === "TECHNICAL") {
    where.assignedToId = session.userId;
  } else if (session.role === "EMPLOYEE") {
    where.createdById = session.userId;
  }

  if (status) where.status = status as Status;
  if (priority) where.priority = priority as Priority;
  if (category) where.category = category as Category;
  if (search) where.title = { contains: search, mode: "insensitive" };

  // Managers get the extra "assigned to" filter, including "unassigned".
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Tickets</h1>
        <p className="mt-1 text-sm text-slate-500">
          {session.role === "MANAGER"
            ? "All tickets in the system."
            : session.role === "TECHNICAL"
            ? "Tickets assigned to you."
            : "Tickets you've submitted."}
        </p>
      </div>

      <TicketFilters
        technicalUsers={technicalUsers}
        showAssignedFilter={session.role === "MANAGER"}
      />

      <TicketTable tickets={tickets} />
    </div>
  );
}
