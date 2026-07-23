"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignTicketAction,
  updateTicketStatusAction,
  updateTicketPriorityAction,
} from "@/actions/tickets";
import { SubmitButton } from "@/components/SubmitButton";
import type { Role, Status } from "@prisma/client";

type TechOption = { id: string; name: string };

type Props = {
  ticketId: string;
  status: Status;
  priority: string;
  assignedToId: string | null;
  role: Role;
  userId: string;
  isCreator: boolean;
  technicalUsers: TechOption[];
  nextSteps: Status[];
};

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "Mark Assigned",
  IN_PROGRESS: "Start Work",
  RESOLVED: "Mark Resolved",
  CLOSED: "Confirm & Close",
};

export function TicketActions({
  ticketId,
  status,
  priority,
  assignedToId,
  role,
  isCreator,
  technicalUsers,
  nextSteps,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState(assignedToId ?? "");
  const [selectedPriority, setSelectedPriority] = useState(priority);

  function runAction(fn: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
      } else {
        router.refresh();
      }
    });
  }

  const canAssign = role === "MANAGER" && status !== "RESOLVED" && status !== "CLOSED";
  const canChangePriority = role === "MANAGER" && status !== "CLOSED";
  // Employee can only confirm-close from Resolved; enforced again server-side.
  const visibleNextSteps = nextSteps.filter((s) => {
    if (role === "MANAGER") return true;
    if (role === "TECHNICAL") return s === "IN_PROGRESS" || s === "RESOLVED";
    if (role === "EMPLOYEE") return s === "CLOSED" && isCreator;
    return false;
  });

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Actions</h3>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}

      {canAssign && (
        <div>
          <label className="block text-xs font-medium text-slate-600">Assign to</label>
          <div className="mt-1 flex gap-2">
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">Select technical employee…</option>
              {technicalUsers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <SubmitButton
              type="button"
              variant="secondary"
              pending={isPending}
              disabled={!selectedTech}
              onClick={() => {
                const fd = new FormData();
                fd.set("ticketId", ticketId);
                fd.set("technicalUserId", selectedTech);
                runAction(() => assignTicketAction(null, fd));
              }}
            >
              {assignedToId ? "Reassign" : "Assign"}
            </SubmitButton>
          </div>
        </div>
      )}

      {canChangePriority && (
        <div>
          <label className="block text-xs font-medium text-slate-600">Priority</label>
          <div className="mt-1 flex gap-2">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <SubmitButton
              type="button"
              variant="secondary"
              pending={isPending}
              disabled={selectedPriority === priority}
              onClick={() => {
                const fd = new FormData();
                fd.set("ticketId", ticketId);
                fd.set("priority", selectedPriority);
                runAction(() => updateTicketPriorityAction(null, fd));
              }}
            >
              Update
            </SubmitButton>
          </div>
        </div>
      )}

      {visibleNextSteps.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-600">Status</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {visibleNextSteps.map((next) => (
              <SubmitButton
                key={next}
                type="button"
                pending={isPending}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("ticketId", ticketId);
                  fd.set("status", next);
                  runAction(() => updateTicketStatusAction(null, fd));
                }}
              >
                {STATUS_LABELS[next] ?? next}
              </SubmitButton>
            ))}
          </div>
        </div>
      )}

      {!canAssign && !canChangePriority && visibleNextSteps.length === 0 && (
        <p className="text-xs text-slate-500">No actions available for this ticket right now.</p>
      )}
    </div>
  );
}
