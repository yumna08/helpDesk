import type { Role, Status } from "@prisma/client";

// Single source of truth for "who can do what" so Server Actions and UI
// stay in sync instead of duplicating role checks ad hoc. UI checks are for
// UX only (hiding buttons); every action re-checks these server-side too,
// since the client can never be trusted.

export const STATUS_TRANSITIONS: Record<Status, Status[]> = {
  OPEN: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

/**
 * Returns true if `role` is allowed to move a ticket from `from` to `to`,
 * per the workflow defined in the spec:
 *  - Employee: create (Open), confirm (Resolved -> Closed)
 *  - Technical: Assigned -> In Progress -> Resolved
 *  - Manager: assign (Open -> Assigned), and can update any valid transition
 */
export function canTransition(role: Role, from: Status, to: Status): boolean {
  const validNextSteps = STATUS_TRANSITIONS[from];
  if (!validNextSteps.includes(to)) return false;

  if (role === "MANAGER") return true;

  if (role === "TECHNICAL") {
    return (
      (from === "ASSIGNED" && to === "IN_PROGRESS") ||
      (from === "IN_PROGRESS" && to === "RESOLVED")
    );
  }

  if (role === "EMPLOYEE") {
    return from === "RESOLVED" && to === "CLOSED";
  }

  return false;
}

export function canAssignTicket(role: Role): boolean {
  return role === "MANAGER";
}

export function canChangePriority(role: Role): boolean {
  return role === "MANAGER";
}

export function canComment(role: Role, isCreator: boolean, isAssignee: boolean): boolean {
  // Anyone connected to the ticket can leave an update; managers can comment
  // on anything since they coordinate assignments.
  return role === "MANAGER" || isCreator || isAssignee;
}

export function canViewTicket(
  role: Role,
  userId: string,
  ticket: { createdById: string; assignedToId: string | null }
): boolean {
  if (role === "MANAGER") return true;
  if (role === "TECHNICAL") return ticket.assignedToId === userId;
  if (role === "EMPLOYEE") return ticket.createdById === userId;
  return false;
}

export const CATEGORY_LABELS: Record<string, string> = {
  IT_SUPPORT: "IT Support",
  FACILITIES: "Facilities",
  HR: "HR",
  OTHER: "Other",
};

export const PRIORITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};
