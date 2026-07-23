"use client";

import { useTransition } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginAction, type ActionResult } from "@/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { SubmitButton } from "@/components/SubmitButton";

const initialState: ActionResult | null = null;

export function LoginForm() {
  const [state, dispatch] = useFormState(loginAction, initialState);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  function onValid(data: LoginInput) {
    const fd = new FormData();
    fd.set("email", data.email);
    fd.set("password", data.password);
    startTransition(() => dispatch(fd));
  }

  const setDemoAccount = (email: string) => {
    setValue("email", email);
    setValue("password", "password123");
  };

  return (
    <div className="space-y-6">
      <div className="card-elevated p-4 border-accent/10">
        <div className="text-[10px] font-bold text-accent mb-3 uppercase tracking-widest">
          Demo Accounts
        </div>
        <div className="flex gap-2">
          {[
            { label: "Manager", email: "manager1@company.com" },
            { label: "Tech", email: "tech1@company.com" },
            { label: "Employee", email: "emp1@company.com" },
          ].map((demo) => (
            <button
              key={demo.email}
              type="button"
              onClick={() => setDemoAccount(demo.email)}
              className="px-3 py-1.5 bg-surface border border-border rounded-xl text-xs font-bold text-white hover:border-accent/40 hover:bg-accent-dim transition-colors"
            >
              {demo.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onValid)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            {...register("email")}
            className="input-field"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
            className="input-field tracking-widest"
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        {state?.error && <p className="error-box">{state.error}</p>}

        <SubmitButton className="w-full" pending={isPending} pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </form>
    </div>
  );
}
