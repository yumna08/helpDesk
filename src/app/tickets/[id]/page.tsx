import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { canViewTicket, STATUS_TRANSITIONS } from "@/lib/permissions";
import { StatusBadge, PriorityBadge, CategoryBadge } from "@/components/Badges";
import { formatDate, ticketNumber } from "@/lib/utils";
import { TicketActions } from "./TicketActions";
import { CommentForm } from "./CommentForm";

export default async function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const ticket = await db.ticket.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      comments: {
        include: { author: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      activities: {
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) notFound();

  if (!canViewTicket(session.role, session.userId, ticket)) {
    // Don't leak existence of tickets a user shouldn't see - treat as 404.
    notFound();
  }

  const technicalUsers =
    session.role === "MANAGER"
      ? await db.user.findMany({
          where: { role: "TECHNICAL" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [];

  // Merge comments + activities into one chronological timeline feed.
  type TimelineItem =
    | { kind: "activity"; id: string; createdAt: Date; actor: string; description: string }
    | { kind: "comment"; id: string; createdAt: Date; actor: string; role: string; content: string };

  const timeline: TimelineItem[] = [
    ...ticket.activities.map((a) => ({
      kind: "activity" as const,
      id: a.id,
      createdAt: a.createdAt,
      actor: a.actor.name,
      description: a.description,
    })),
    ...ticket.comments.map((c) => ({
      kind: "comment" as const,
      id: c.id,
      createdAt: c.createdAt,
      actor: c.author.name,
      role: c.author.role,
      content: c.content,
    })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const isCreator = ticket.createdById === session.userId;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-mono">{ticketNumber(ticket.seq)}</span>
            <span>·</span>
            <span>Created {formatDate(ticket.createdAt)}</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{ticket.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <CategoryBadge category={ticket.category} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
            {ticket.description}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Activity timeline</h3>
          <ol className="mt-4 space-y-4 border-l border-slate-200 pl-4">
            {timeline.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-400" />
                <div className="text-xs text-slate-400">{formatDate(item.createdAt)}</div>
                {item.kind === "activity" ? (
                  <p className="text-sm text-slate-700">{item.description}</p>
                ) : (
                  <div className="mt-1 rounded-md bg-slate-50 p-2">
                    <div className="text-xs font-medium text-slate-600">{item.actor}</div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">
                      {item.content}
                    </p>
                  </div>
                )}
              </li>
            ))}
            {timeline.length === 0 && (
              <li className="text-sm text-slate-500">No activity yet.</li>
            )}
          </ol>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Add a comment</h3>
          <CommentForm ticketId={ticket.id} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Details</h3>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Created by</dt>
              <dd className="text-slate-800">{ticket.createdBy.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Assigned to</dt>
              <dd className="text-slate-800">
                {ticket.assignedTo?.name ?? <span className="text-slate-400">Unassigned</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Category</dt>
              <dd className="text-slate-800">{ticket.category.replace("_", " ")}</dd>
            </div>
            {ticket.resolvedAt && (
              <div>
                <dt className="text-xs text-slate-500">Resolved</dt>
                <dd className="text-slate-800">{formatDate(ticket.resolvedAt)}</dd>
              </div>
            )}
            {ticket.closedAt && (
              <div>
                <dt className="text-xs text-slate-500">Closed</dt>
                <dd className="text-slate-800">{formatDate(ticket.closedAt)}</dd>
              </div>
            )}
          </dl>
        </div>

        <TicketActions
          ticketId={ticket.id}
          status={ticket.status}
          priority={ticket.priority}
          assignedToId={ticket.assignedToId}
          role={session.role}
          userId={session.userId}
          isCreator={isCreator}
          technicalUsers={technicalUsers}
          nextSteps={STATUS_TRANSITIONS[ticket.status]}
        />
      </div>
    </div>
  );
}
