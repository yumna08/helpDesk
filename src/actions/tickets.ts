"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  canAssignTicket,
  canChangePriority,
  canComment,
  canTransition,
  canViewTicket,
} from "@/lib/permissions";
import {
  assignTicketSchema,
  commentSchema,
  createTicketSchema,
  updatePrioritySchema,
  updateStatusSchema,
} from "@/lib/validations";
import { ticketNumber } from "@/lib/utils";
import type { Status } from "@/lib/domain-types";

export type ActionResult = {
  success: boolean;
  error?: string;
};

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

// ---------- Create ----------

export async function createTicketAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();

  // Any authenticated user can technically hit this action; we restrict at
  // the UI level to Employees, but re-check here too since the spec's
  // "Employee: Can create" implies others shouldn't need to (managers /
  // techs still can, since nothing in the spec forbids it and real helpdesks
  // let anyone file a ticket for themselves).
  const parsed = createTicketSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { success: false, error: firstIssue?.message ?? "Invalid input." };
  }

  const latestTicket = await db.ticket.findFirst({
    orderBy: { seq: "desc" },
  });

  const ticket = await db.ticket.create({
    data: {
      seq: (latestTicket?.seq ?? 0) + 1,
      ...parsed.data,
      createdById: session.userId,
      status: "OPEN",
      activities: {
        create: {
          actorId: session.userId,
          type: "CREATED",
          description: `Ticket created by ${session.name}.`,
        },
      },
    },
  });

  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  redirect(`/tickets/${ticket.id}`);
}

// ---------- Assign ----------

export async function assignTicketAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();

  if (!canAssignTicket(session.role)) {
    return { success: false, error: "Only managers can assign tickets." };
  }

  const parsed = assignTicketSchema.safeParse({
    ticketId: formData.get("ticketId"),
    technicalUserId: formData.get("technicalUserId"),
  });
  if (!parsed.success) {
    return { success: false, error: "Please select a technical employee." };
  }
  const { ticketId, technicalUserId } = parsed.data;

  const [ticket, technicalUser] = await Promise.all([
    db.ticket.findUnique({ where: { id: ticketId } }),
    db.user.findUnique({ where: { id: technicalUserId } }),
  ]);

  if (!ticket) return { success: false, error: "Ticket not found." };
  if (!technicalUser || technicalUser.role !== "TECHNICAL") {
    return { success: false, error: "Selected user is not a technical employee." };
  }
  if (ticket.status !== "OPEN" && ticket.assignedToId !== null) {
    // Allow re-assignment at any pre-resolved stage, but not after resolved/closed.
    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
      return { success: false, error: "Cannot reassign a resolved or closed ticket." };
    }
  }

  const newStatus: Status =
    ticket.status === "OPEN" ? "ASSIGNED" : (ticket.status as Status);

  await db.$transaction([
    db.ticket.update({
      where: { id: ticketId },
      data: { assignedToId: technicalUserId, status: newStatus },
    }),
    db.activity.create({
      data: {
        ticketId,
        actorId: session.userId,
        type: "ASSIGNED",
        description: `Assigned to ${technicalUser.name} by ${session.name}.`,
      },
    }),
  ]);

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

// ---------- Status ----------

export async function updateTicketStatusAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();

  const parsed = updateStatusSchema.safeParse({
    ticketId: formData.get("ticketId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { success: false, error: "Invalid status update." };
  }
  const { ticketId, status } = parsed.data;

  const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { success: false, error: "Ticket not found." };

  if (!canViewTicket(session.role, session.userId, ticket)) {
    return { success: false, error: "You do not have access to this ticket." };
  }

  if (!canTransition(session.role, ticket.status as Status, status as Status)) {
    return {
      success: false,
      error: `You are not allowed to move this ticket from ${ticket.status} to ${status}.`,
    };
  }

  // ASSIGNED requires an assignee — managers must use the assign action,
  // not a bare status change, so tickets never sit "Assigned" with nobody on them.
  if (status === "ASSIGNED" && !ticket.assignedToId) {
    return {
      success: false,
      error: "Assign a technical employee before marking this ticket as Assigned.",
    };
  }

  if (
    (status === "IN_PROGRESS" || status === "RESOLVED") &&
    session.role === "TECHNICAL" &&
    ticket.assignedToId !== session.userId
  ) {
    return { success: false, error: "You can only update tickets assigned to you." };
  }

  if (status === "CLOSED" && session.role === "EMPLOYEE" && ticket.createdById !== session.userId) {
    return { success: false, error: "Only the ticket creator can confirm resolution." };
  }

  const now = new Date();
  await db.$transaction([
    db.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        resolvedAt: status === "RESOLVED" ? now : ticket.resolvedAt,
        closedAt: status === "CLOSED" ? now : ticket.closedAt,
      },
    }),
    db.activity.create({
      data: {
        ticketId,
        actorId: session.userId,
        type: "STATUS_CHANGED",
        description: `Status changed to ${status.replace("_", " ")} by ${session.name}.`,
      },
    }),
  ]);

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

// ---------- Priority (manager override) ----------

export async function updateTicketPriorityAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();

  if (!canChangePriority(session.role)) {
    return { success: false, error: "Only managers can change priority." };
  }

  const parsed = updatePrioritySchema.safeParse({
    ticketId: formData.get("ticketId"),
    priority: formData.get("priority"),
  });
  if (!parsed.success) {
    return { success: false, error: "Invalid priority." };
  }
  const { ticketId, priority } = parsed.data;

  const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { success: false, error: "Ticket not found." };

  await db.$transaction([
    db.ticket.update({ where: { id: ticketId }, data: { priority } }),
    db.activity.create({
      data: {
        ticketId,
        actorId: session.userId,
        type: "PRIORITY_CHANGED",
        description: `Priority changed to ${priority} by ${session.name}.`,
      },
    }),
  ]);

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

// ---------- Comments ----------

export async function addCommentAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();

  const parsed = commentSchema.safeParse({
    ticketId: formData.get("ticketId"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { success: false, error: firstIssue?.message ?? "Invalid comment." };
  }
  const { ticketId, content } = parsed.data;

  const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { success: false, error: "Ticket not found." };

  const isCreator = ticket.createdById === session.userId;
  const isAssignee = ticket.assignedToId === session.userId;
  if (!canComment(session.role, isCreator, isAssignee)) {
    return { success: false, error: "You cannot comment on this ticket." };
  }

  await db.$transaction([
    db.comment.create({
      data: { ticketId, authorId: session.userId, content },
    }),
    db.activity.create({
      data: {
        ticketId,
        actorId: session.userId,
        type: "COMMENT",
        description: `${session.name} added a comment.`,
      },
    }),
  ]);

  revalidatePath(`/tickets/${ticketId}`);
  return { success: true };
}

export { ticketNumber };
