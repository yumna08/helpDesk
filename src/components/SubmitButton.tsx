"use client";

import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  pending?: boolean;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "submit" | "button";
  onClick?: () => void;
  disabled?: boolean;
};

const VARIANTS: Record<string, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-50",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  ghost: "text-slate-600 hover:bg-slate-100 disabled:opacity-50",
};

// Pending state is passed explicitly (from useTransition in the parent form)
// rather than read via useFormStatus, since our forms dispatch Server
// Actions manually after React Hook Form validates client-side, not through
// a native <form action={...}> submission that useFormStatus tracks.
export function SubmitButton({
  children,
  className,
  pending = false,
  pendingText = "Saving…",
  variant = "primary",
  type = "submit",
  onClick,
  disabled = false,
}: Props) {
  return (
    <button
      type={type}
      disabled={pending || disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        className
      )}
    >
      {pending ? pendingText : children}
    </button>
  );
}
