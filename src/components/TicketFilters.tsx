"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { Search } from "lucide-react";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/utils";

const STATUS_OPTIONS = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const CATEGORY_OPTIONS = ["IT_SUPPORT", "FACILITIES", "HR", "OTHER"];

type TechOption = { id: string; name: string };

export function TicketFilters({
  technicalUsers,
  showAssignedFilter,
}: {
  technicalUsers: TechOption[];
  showAssignedFilter: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function onSearchChange(value: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => updateParam("search", value), 300);
  }

  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <div className="relative flex-1 min-w-[300px]">
        <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search tickets..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          defaultValue={searchParams.get("priority") ?? ""}
          onChange={(e) => updateParam("priority", e.target.value)}
          className="select-field"
        >
          <option value="" className="bg-surface-elevated">
            All Priorities
          </option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p} className="bg-surface-elevated">
              {PRIORITY_LABELS[p] ?? p}
            </option>
          ))}
        </select>

        <select
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(e) => updateParam("status", e.target.value)}
          className="select-field"
        >
          <option value="" className="bg-surface-elevated">
            All Statuses
          </option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="bg-surface-elevated">
              {STATUS_LABELS[s] ?? s}
            </option>
          ))}
        </select>

        <select
          defaultValue={searchParams.get("category") ?? ""}
          onChange={(e) => updateParam("category", e.target.value)}
          className="select-field"
        >
          <option value="" className="bg-surface-elevated">
            All Categories
          </option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c} className="bg-surface-elevated">
              {CATEGORY_LABELS[c] ?? c}
            </option>
          ))}
        </select>

        {showAssignedFilter && (
          <select
            defaultValue={searchParams.get("assignedTo") ?? ""}
            onChange={(e) => updateParam("assignedTo", e.target.value)}
            className="select-field"
          >
            <option value="" className="bg-surface-elevated">
              All Assignees
            </option>
            <option value="unassigned" className="bg-surface-elevated">
              Unassigned
            </option>
            {technicalUsers.map((t) => (
              <option key={t.id} value={t.id} className="bg-surface-elevated">
                {t.name}
              </option>
            ))}
          </select>
        )}

        <select
          defaultValue={searchParams.get("sort") ?? "date_desc"}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="select-field"
        >
          <option value="date_desc" className="bg-surface-elevated">
            Sort: Newest
          </option>
          <option value="date_asc" className="bg-surface-elevated">
            Sort: Oldest
          </option>
          <option value="priority" className="bg-surface-elevated">
            Sort: Priority
          </option>
          <option value="status" className="bg-surface-elevated">
            Sort: Status
          </option>
        </select>
      </div>
    </div>
  );
}
