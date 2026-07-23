import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatCard } from "@/components/StatCard";
import {
  TicketsLineChart,
  StatusPieChart,
  PriorityBarChart,
} from "@/components/DashboardCharts";
import {
  ClipboardList,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Hourglass,
} from "lucide-react";
import type { Priority, Status } from "@/lib/domain-types";

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

async function weekTrend() {
  const days = Array.from({ length: 7 }, (_, i) => {
    const start = daysAgo(6 - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end, name: start.toLocaleDateString("en-US", { weekday: "short" }) };
  });

  return Promise.all(
    days.map(async ({ start, end, name }) => {
      const [created, resolved] = await Promise.all([
        db.ticket.count({
          where: { createdAt: { gte: start, lt: end } },
        }),
        db.ticket.count({
          where: { resolvedAt: { gte: start, lt: end } },
        }),
      ]);
      return { name, created, resolved };
    })
  );
}

async function statusCounts(where: Record<string, unknown> = {}) {
  const statuses: Status[] = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  const labels: Record<Status, string> = {
    OPEN: "Open",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };
  const counts = await Promise.all(
    statuses.map((status) => db.ticket.count({ where: { ...where, status } }))
  );
  return statuses.map((status, i) => ({
    name: labels[status],
    value: counts[i],
    status,
  }));
}

async function priorityCounts(where: Record<string, unknown> = {}) {
  const priorities: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const labels: Record<Priority, string> = {
    CRITICAL: "Critical",
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
  };
  const counts = await Promise.all(
    priorities.map((priority) => db.ticket.count({ where: { ...where, priority } }))
  );
  return priorities.map((priority, i) => ({
    name: labels[priority],
    value: counts[i],
  }));
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "MANAGER") {
    return <ManagerDashboard name={session.name} />;
  }
  if (session.role === "TECHNICAL") {
    return <TechnicalDashboard userId={session.userId} name={session.name} />;
  }
  return <EmployeeDashboard userId={session.userId} name={session.name} />;
}

async function ManagerDashboard({ name }: { name: string }) {
  const today = startOfDay();
  const firstName = name.split(" ")[0];

  const [
    total,
    open,
    assigned,
    inProgress,
    resolved,
    closed,
    critical,
    resolvedToday,
    techWorkload,
    byStatus,
    byPriority,
    weekData,
  ] = await Promise.all([
    db.ticket.count(),
    db.ticket.count({ where: { status: "OPEN" } }),
    db.ticket.count({ where: { status: "ASSIGNED" } }),
    db.ticket.count({ where: { status: "IN_PROGRESS" } }),
    db.ticket.count({ where: { status: "RESOLVED" } }),
    db.ticket.count({ where: { status: "CLOSED" } }),
    db.ticket.count({
      where: {
        priority: "CRITICAL",
        status: { notIn: ["RESOLVED", "CLOSED"] },
      },
    }),
    db.ticket.count({
      where: { resolvedAt: { gte: today } },
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
      orderBy: { name: "asc" },
    }),
    statusCounts(),
    priorityCounts(),
    weekTrend(),
  ]);

  const maxLoad = Math.max(...techWorkload.map((t) => t.assignedTickets.length), 1);
  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Here&apos;s what&apos;s happening with your team today.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Tickets"
          value={total}
          icon={<ClipboardList className="w-5 h-5" />}
          iconBg="bg-accent-dim"
          iconColor="text-accent"
        />
        <StatCard
          label="Open"
          value={open}
          icon={<Sparkles className="w-5 h-5" />}
          iconBg="bg-accent-dim"
          iconColor="text-accent"
        />
        <StatCard
          label="Critical"
          value={critical}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-red-500/15"
          iconColor="text-red-400"
        />
        <StatCard
          label="Resolved Today"
          value={resolvedToday}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
        />
        <StatCard
          label="Closed"
          value={closed}
          icon={<XCircle className="w-5 h-5" />}
          iconBg="bg-surface-elevated"
          iconColor="text-muted"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 card p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-white">Tickets This Week</h2>
            <p className="text-sm text-text-secondary">Created vs. resolved</p>
          </div>
          <TicketsLineChart data={weekData} />
        </div>

        <div className="card p-6">
          <div className="mb-2">
            <h2 className="text-base font-semibold text-white">By Status</h2>
          </div>
          <StatusPieChart data={byStatus} />
          <div className="mt-4 space-y-2">
            {byStatus.map((s) => (
              <div key={s.name} className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        s.name === "Open"
                          ? "#3b82f6"
                          : s.name === "Assigned"
                            ? "#f59e0b"
                            : s.name === "In Progress"
                              ? "#6366f1"
                              : s.name === "Resolved"
                                ? "#22c55e"
                                : "#94a3b8",
                    }}
                  />
                  <span className="text-muted">{s.name}</span>
                </div>
                <span className="font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-6">By Priority</h2>
          <PriorityBarChart data={byPriority} />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white">Team Workload</h2>
            <span className="text-xs text-text-secondary">
              Active: {assigned + inProgress} · Resolved: {resolved}
            </span>
          </div>
          <div className="space-y-6">
            {techWorkload.length === 0 && (
              <p className="text-sm text-text-secondary">No technical staff yet.</p>
            )}
            {techWorkload.map((t) => {
              const load = t.assignedTickets.length;
              return (
                <div key={t.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent text-black flex items-center justify-center text-xs font-bold">
                        {t.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{t.name}</div>
                        <div className="text-xs text-accent">
                          {load} active ticket{load === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-text-secondary">{load} assigned</div>
                  </div>
                  <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-accent h-full rounded-full"
                      style={{ width: `${(load / maxLoad) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/tickets?status=OPEN"
          className="text-sm font-medium text-accent hover:text-accent/80"
        >
          View unassigned tickets →
        </Link>
      </div>
    </div>
  );
}

async function TechnicalDashboard({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const firstName = name.split(" ")[0];
  const where = { assignedToId: userId };
  const today = startOfDay();

  const [total, assigned, inProgress, resolved, resolvedToday, awaiting, byStatus, byPriority] =
    await Promise.all([
      db.ticket.count({ where }),
      db.ticket.count({ where: { ...where, status: "ASSIGNED" } }),
      db.ticket.count({ where: { ...where, status: "IN_PROGRESS" } }),
      db.ticket.count({ where: { ...where, status: "RESOLVED" } }),
      db.ticket.count({ where: { ...where, resolvedAt: { gte: today } } }),
      db.ticket.count({
        where: { ...where, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      }),
      statusCounts(where),
      priorityCounts({ ...where, status: { in: ["ASSIGNED", "IN_PROGRESS"] } }),
    ]);

  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-text-secondary mt-1">Your assigned tickets and workload.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="My Tickets"
          value={total}
          icon={<ClipboardList className="w-5 h-5" />}
          iconBg="bg-accent-dim"
          iconColor="text-accent"
        />
        <StatCard
          label="Awaiting Start"
          value={assigned}
          icon={<Hourglass className="w-5 h-5" />}
          iconBg="bg-amber-500/15"
          iconColor="text-amber-400"
        />
        <StatCard
          label="In Progress"
          value={inProgress}
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-accent-dim"
          iconColor="text-accent"
        />
        <StatCard
          label="Resolved Today"
          value={resolvedToday}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-2">My Tickets by Status</h2>
          <StatusPieChart data={byStatus} />
          <div className="mt-4 space-y-2">
            {byStatus.map((s) => (
              <div key={s.name} className="flex justify-between text-sm">
                <span className="text-muted">{s.name}</span>
                <span className="font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-6">
            Active by Priority ({awaiting} open)
          </h2>
          <PriorityBarChart data={byPriority} />
          <div className="mt-6 flex gap-3">
            <Link
              href="/tickets?status=ASSIGNED"
              className="text-sm font-medium text-accent hover:text-accent/80"
            >
              Start assigned work →
            </Link>
            <span className="text-border">·</span>
            <span className="text-sm text-text-secondary">{resolved} resolved total</span>
          </div>
        </div>
      </div>
    </div>
  );
}

async function EmployeeDashboard({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const firstName = name.split(" ")[0];
  const where = { createdById: userId };

  const [total, open, inFlight, resolved, awaitingConfirm, closed, byStatus] =
    await Promise.all([
      db.ticket.count({ where }),
      db.ticket.count({ where: { ...where, status: "OPEN" } }),
      db.ticket.count({
        where: { ...where, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      }),
      db.ticket.count({ where: { ...where, status: "RESOLVED" } }),
      db.ticket.count({ where: { ...where, status: "RESOLVED" } }),
      db.ticket.count({ where: { ...where, status: "CLOSED" } }),
      statusCounts(where),
    ]);

  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Track your requests and confirm resolutions.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="My Tickets"
          value={total}
          icon={<ClipboardList className="w-5 h-5" />}
          iconBg="bg-accent-dim"
          iconColor="text-accent"
        />
        <StatCard
          label="Open / Pending"
          value={open}
          icon={<Sparkles className="w-5 h-5" />}
          iconBg="bg-accent-dim"
          iconColor="text-accent"
        />
        <StatCard
          label="Being Worked On"
          value={inFlight}
          icon={<UserCheck className="w-5 h-5" />}
          iconBg="bg-amber-500/15"
          iconColor="text-amber-400"
        />
        <StatCard
          label="Awaiting Your Confirmation"
          value={awaitingConfirm}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-2">My Tickets by Status</h2>
          <StatusPieChart data={byStatus} />
          <div className="mt-4 space-y-2">
            {byStatus.map((s) => (
              <div key={s.name} className="flex justify-between text-sm">
                <span className="text-muted">{s.name}</span>
                <span className="font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white mb-2">Quick actions</h2>
            <p className="text-sm text-text-secondary mb-6">
              {awaitingConfirm > 0
                ? `You have ${awaitingConfirm} ticket${awaitingConfirm === 1 ? "" : "s"} ready to confirm.`
                : closed > 0
                  ? `${closed} of your tickets are closed.`
                  : "Submit a new request when something needs attention."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/tickets/create" className="btn-primary">
              Create ticket
            </Link>
            {awaitingConfirm > 0 && (
              <Link href="/tickets?status=RESOLVED" className="btn-secondary">
                Confirm resolutions
              </Link>
            )}
            <Link href="/tickets" className="btn-secondary">
              View all my tickets
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
