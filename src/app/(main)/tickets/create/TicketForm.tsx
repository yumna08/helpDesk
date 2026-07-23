"use client";

import { useTransition } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTicketAction, type ActionResult } from "@/actions/tickets";
import { createTicketSchema, type CreateTicketInput } from "@/lib/validations";
import { SubmitButton } from "@/components/SubmitButton";
import clsx from "clsx";

const initialState: ActionResult | null = null;

const CATEGORY_OPTIONS = [
  { value: "IT_SUPPORT", label: "IT Support" },
  { value: "FACILITIES", label: "Facilities" },
  { value: "HR", label: "HR" },
  { value: "OTHER", label: "Other" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low", desc: "Non-urgent, can wait" },
  { value: "MEDIUM", label: "Medium", desc: "Affects productivity" },
  { value: "HIGH", label: "High", desc: "Significantly impactful" },
  { value: "CRITICAL", label: "Critical", desc: "Complete blocker" },
] as const;

export function TicketForm() {
  const [state, dispatch] = useFormState(createTicketAction, initialState);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    mode: "onBlur",
    defaultValues: { category: "IT_SUPPORT", priority: "MEDIUM" },
  });

  const titleValue = watch("title", "");
  const priorityValue = watch("priority");

  function onValid(data: CreateTicketInput) {
    const fd = new FormData();
    fd.set("title", data.title);
    fd.set("description", data.description);
    fd.set("category", data.category);
    fd.set("priority", data.priority);
    startTransition(() => dispatch(fd));
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-6" noValidate>
      <div className="card p-8">
        <h2 className="text-base font-bold text-white mb-6">Issue Details</h2>

        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="label">
              Title <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                id="title"
                {...register("title")}
                placeholder="Brief description of the issue..."
                className="input-field pr-16"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted">
                {titleValue.length}/100
              </div>
            </div>
            {errors.title && (
              <p className="mt-1.5 text-xs text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              {...register("description")}
              placeholder="Please describe the issue in detail..."
              className="input-field resize-none"
            />
            {errors.description && (
              <p className="mt-1.5 text-xs text-red-400">{errors.description.message}</p>
            )}
          </div>

          <div className="w-full md:w-1/2">
            <label htmlFor="category" className="label">
              Category
            </label>
            <select id="category" {...register("category")} className="input-field">
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value} className="bg-surface-elevated">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-8">
        <h2 className="text-base font-bold text-white mb-6">Priority Level</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {PRIORITY_OPTIONS.map((p) => {
            const isSelected = priorityValue === p.value;
            return (
              <button
                type="button"
                key={p.value}
                onClick={() => setValue("priority", p.value)}
                className={clsx(
                  "text-left p-4 rounded-xl border transition-all",
                  isSelected
                    ? "border-accent bg-accent-dim ring-1 ring-accent/40"
                    : "border-border bg-surface-elevated hover:border-accent/30 hover:bg-accent-dim/50"
                )}
              >
                <div
                  className={clsx(
                    "text-sm font-bold mb-1",
                    isSelected ? "text-accent" : "text-white"
                  )}
                >
                  {p.label}
                </div>
                <div className="text-xs text-muted">{p.desc}</div>
              </button>
            );
          })}
        </div>
        <input type="hidden" {...register("priority")} />
      </div>

      {state?.error && <p className="error-box">{state.error}</p>}

      <div className="flex justify-end pt-4">
        <SubmitButton pending={isPending} pendingText="Submitting…" className="px-8 py-3">
          Submit Ticket
        </SubmitButton>
      </div>
    </form>
  );
}
