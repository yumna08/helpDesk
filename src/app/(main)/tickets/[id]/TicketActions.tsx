"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignTicketAction,
  updateTicketStatusAction,
  updateTicketPriorityAction,
} from "@/actions/tickets";
import { SubmitButton } from "@/components/SubmitButton";
import type { Role, Status } from "@/lib/domain-types";

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
  const visibleNextSteps = nextSteps.filter((s) => {
    if (s === "ASSIGNED") return false;
    if (role === "MANAGER") return true;
    if (role === "TECHNICAL") return s === "IN_PROGRESS" || s === "RESOLVED";
    if (role === "EMPLOYEE") return s === "CLOSED" && isCreator;
    return false;
  });

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-sm font-bold text-white">Actions</h3>

      {error && <p className="error-box text-xs">{error}</p>}

      {canAssign && (
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
            Assign to
          </label>
          <div className="flex gap-2">
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="select-field flex-1"
            >
              <option value="" className="bg-surface-elevated">
                Select technical employee…
              </option>
              {technicalUsers.map((t) => (
                <option key={t.id} value={t.id} className="bg-surface-elevated">
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
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
            Priority
          </label>
          <div className="flex gap-2">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="select-field flex-1"
            >
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                <option key={p} value={p} className="bg-surface-elevated">
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
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
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
        <p className="text-xs text-muted">No actions available for this ticket right now.</p>
      )}
    </div>
  );
}
