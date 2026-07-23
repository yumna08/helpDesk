import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatCard } from "@/components/StatCard";
import { TicketTable } from "@/components/TicketTable";

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

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "MANAGER") return <ManagerDashboard />;
  if (session.role === "TECHNICAL") return <TechnicalDashboard userId={session.userId} />;
  return <EmployeeDashboard userId={session.userId} />;
}

async function ManagerDashboard() {
  const [total, open, assigned, inProgress, resolved, closed, unassigned, critical, recent, techWorkload] =
    await Promise.all([
      db.ticket.count(),
      db.ticket.count({ where: { status: "OPEN" } }),
      db.ticket.count({ where: { status: "ASSIGNED" } }),
      db.ticket.count({ where: { status: "IN_PROGRESS" } }),
      db.ticket.count({ where: { status: "RESOLVED" } }),
      db.ticket.count({ where: { status: "CLOSED" } }),
      db.ticket.count({ where: { assignedToId: null, status: { not: "CLOSED" } } }),
      db.ticket.count({ where: { priority: "CRITICAL", status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      db.ticket.findMany({
        select: TICKET_SELECT,
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.user.findMany({
        where: { role: "TECHNICAL" },
        select: {
          id: true,
          name: true,
          assignedTickets: {
            where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
            select: { id: true },
          },
        },
      }),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Manager Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">All tickets across the team.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total tickets" value={total} />
        <StatCard label="Open" value={open} />
        <StatCard label="Assigned" value={assigned} />
        <StatCard label="In progress" value={inProgress} accent="warning" />
        <StatCard label="Resolved" value={resolved} accent="success" />
        <StatCard label="Closed" value={closed} />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <StatCard label="Unassigned (needs attention)" value={unassigned} accent="danger" />
        <StatCard label="Critical / High priority open" value={critical} accent="danger" />
      </div>

      <div>
        <h2 className="text-lg font-medium text-slate-900">Team workload</h2>
        <p className="text-sm text-slate-500">Open + in-progress tickets per technical employee.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {techWorkload.map((t) => (
            <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="font-medium text-slate-900">{t.name}</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {t.assignedTickets.length}
              </div>
              <div className="text-xs text-slate-500">active tickets</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Recent tickets</h2>
          <Link href="/tickets" className="text-sm font-medium text-indigo-600 hover:underline">
            View all tickets →
          </Link>
        </div>
        <TicketTable tickets={recent} />
      </div>
    </div>
  );
}

async function TechnicalDashboard({ userId }: { userId: string }) {
  const [myTotal, myOpen, myInProgress, myResolved, myTickets] = await Promise.all([
    db.ticket.count({ where: { assignedToId: userId } }),
    db.ticket.count({ where: { assignedToId: userId, status: "ASSIGNED" } }),
    db.ticket.count({ where: { assignedToId: userId, status: "IN_PROGRESS" } }),
    db.ticket.count({ where: { assignedToId: userId, status: "RESOLVED" } }),
    db.ticket.findMany({
      where: { assignedToId: userId, status: { notIn: ["CLOSED"] } },
      select: TICKET_SELECT,
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Tickets assigned to you.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total assigned" value={myTotal} />
        <StatCard label="Awaiting start" value={myOpen} accent="warning" />
        <StatCard label="In progress" value={myInProgress} accent="warning" />
        <StatCard label="Resolved (by me)" value={myResolved} accent="success" />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-slate-900">My open tickets</h2>
        <TicketTable tickets={myTickets} />
      </div>
    </div>
  );
}

async function EmployeeDashboard({ userId }: { userId: string }) {
  const [myTotal, myOpen, awaitingConfirmation, myTickets] = await Promise.all([
    db.ticket.count({ where: { createdById: userId } }),
    db.ticket.count({ where: { createdById: userId, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } } }),
    db.ticket.count({ where: { createdById: userId, status: "RESOLVED" } }),
    db.ticket.findMany({
      where: { createdById: userId },
      select: TICKET_SELECT,
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Tickets you&apos;ve submitted.</p>
        </div>
        <Link
          href="/tickets/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New Ticket
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total tickets" value={myTotal} />
        <StatCard label="In progress" value={myOpen} accent="warning" />
        <StatCard label="Awaiting your confirmation" value={awaitingConfirmation} accent="danger" />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-slate-900">My tickets</h2>
        <TicketTable tickets={myTickets} />
      </div>
    </div>
  );
}
