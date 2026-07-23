import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { canViewTicket, STATUS_TRANSITIONS } from "@/lib/permissions";
import { StatusBadge, PriorityBadge, CategoryBadge } from "@/components/Badges";
import { formatDate, ticketNumber } from "@/lib/utils";
import { TicketActions } from "./TicketActions";
import { CommentForm } from "./CommentForm";
import type { Status } from "@/lib/domain-types";

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

  // Activities of type COMMENT are audit markers; the actual comment body
  // lives on Comment. Skip COMMENT activities so comments aren't double-shown.
  type TimelineItem =
    | { kind: "activity"; id: string; createdAt: Date; actor: string; description: string }
    | { kind: "comment"; id: string; createdAt: Date; actor: string; role: string; content: string };

  const timeline: TimelineItem[] = [
    ...ticket.activities
      .filter((a) => a.type !== "COMMENT")
      .map((a) => ({
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
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="font-mono text-accent">{ticketNumber(ticket.seq)}</span>
            <span>·</span>
            <span>Created {formatDate(ticket.createdAt)}</span>
          </div>
          <h1 className="mt-1 page-title">{ticket.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <CategoryBadge category={ticket.category} />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-white">Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
            {ticket.description}
          </p>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-white">Activity timeline</h3>
          <ol className="mt-4 space-y-4 border-l border-border pl-4">
            {timeline.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-accent" />
                <div className="text-xs text-muted">{formatDate(item.createdAt)}</div>
                {item.kind === "activity" ? (
                  <p className="text-sm text-text-secondary">{item.description}</p>
                ) : (
                  <div className="mt-1 rounded-xl bg-surface-elevated border border-border p-3">
                    <div className="text-xs font-bold text-accent">{item.actor}</div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-white">
                      {item.content}
                    </p>
                  </div>
                )}
              </li>
            ))}
            {timeline.length === 0 && (
              <li className="text-sm text-muted">No activity yet.</li>
            )}
          </ol>
        </div>

        <div className="card p-5">
          <h3 className="mb-2 text-sm font-bold text-white">Add a comment</h3>
          <CommentForm ticketId={ticket.id} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-white">Details</h3>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted uppercase tracking-wider">Created by</dt>
              <dd className="text-white font-medium">{ticket.createdBy.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted uppercase tracking-wider">Assigned to</dt>
              <dd className="text-white font-medium">
                {ticket.assignedTo?.name ?? <span className="text-muted">Unassigned</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted uppercase tracking-wider">Category</dt>
              <dd className="mt-1">
                <CategoryBadge category={ticket.category} />
              </dd>
            </div>
            {ticket.resolvedAt && (
              <div>
                <dt className="text-xs text-muted uppercase tracking-wider">Resolved</dt>
                <dd className="text-white font-medium">{formatDate(ticket.resolvedAt)}</dd>
              </div>
            )}
            {ticket.closedAt && (
              <div>
                <dt className="text-xs text-muted uppercase tracking-wider">Closed</dt>
                <dd className="text-white font-medium">{formatDate(ticket.closedAt)}</dd>
              </div>
            )}
          </dl>
        </div>

        <TicketActions
          ticketId={ticket.id}
          status={ticket.status as Status}
          priority={ticket.priority}
          assignedToId={ticket.assignedToId}
          role={session.role}
          userId={session.userId}
          isCreator={isCreator}
          technicalUsers={technicalUsers}
          nextSteps={STATUS_TRANSITIONS[ticket.status as Status]}
        />
      </div>
    </div>
  );
}
