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
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger:
    "inline-flex items-center justify-center rounded-xl bg-red-500/20 border border-red-500/30 px-5 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/30 disabled:opacity-50",
  ghost: "btn-ghost",
};

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
      className={cn(VARIANTS[variant], className)}
    >
      {pending ? pendingText : children}
    </button>
  );
}
