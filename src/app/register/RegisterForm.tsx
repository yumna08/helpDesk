"use client";

import { useTransition } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerAction, type ActionResult } from "@/actions/auth";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { SubmitButton } from "@/components/SubmitButton";

const initialState: ActionResult | null = null;

const ROLE_OPTIONS = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "TECHNICAL", label: "Technical Staff" },
  { value: "MANAGER", label: "Manager" },
] as const;

export function RegisterForm() {
  const [state, dispatch] = useFormState(registerAction, initialState);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: { role: "EMPLOYEE" },
  });

  function onValid(data: RegisterInput) {
    const fd = new FormData();
    fd.set("name", data.name);
    fd.set("email", data.email);
    fd.set("password", data.password);
    fd.set("role", data.role);
    startTransition(() => dispatch(fd));
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor="name" className="label">
          Full name
        </label>
        <input id="name" {...register("name")} className="input-field" />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input id="email" type="email" {...register("email")} className="input-field" />
        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register("password")}
          className="input-field"
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
        )}
      </div>
      <div>
        <label htmlFor="role" className="label">
          Role
        </label>
        <select id="role" {...register("role")} className="input-field">
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value} className="bg-surface-elevated">
              {r.label}
            </option>
          ))}
        </select>
        {errors.role && <p className="mt-1 text-xs text-red-400">{errors.role.message}</p>}
      </div>

      {state?.error && <p className="error-box">{state.error}</p>}

      <SubmitButton className="w-full" pending={isPending} pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
