"use client";

import { useEffect, useRef, useTransition } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { addCommentAction, type ActionResult } from "@/actions/tickets";
import { commentSchema, type CommentInput } from "@/lib/validations";
import { SubmitButton } from "@/components/SubmitButton";

const initialState: ActionResult | null = null;

export function CommentForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [state, dispatch] = useFormState(addCommentAction, initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: { ticketId, content: "" },
  });

  useEffect(() => {
    if (state?.success) {
      reset({ ticketId, content: "" });
      router.refresh();
    }
  }, [state, reset, ticketId, router]);

  function onValid(data: CommentInput) {
    const fd = new FormData();
    fd.set("ticketId", data.ticketId);
    fd.set("content", data.content);
    startTransition(() => dispatch(fd));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit(onValid)} className="space-y-2" noValidate>
      <input type="hidden" {...register("ticketId")} value={ticketId} />
      <textarea
        {...register("content")}
        rows={3}
        placeholder="Add a comment or update…"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      {errors.content && <p className="text-xs text-red-600">{errors.content.message}</p>}
      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>
      )}
      <div className="flex justify-end">
        <SubmitButton pending={isPending} pendingText="Posting…">
          Post comment
        </SubmitButton>
      </div>
    </form>
  );
}
