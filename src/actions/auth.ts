"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Role } from "@/lib/domain-types";
import {
  createSessionCookie,
  clearSessionCookie,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations";

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function loginAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // Server-side validation is authoritative. The client also validates with
  // the same Zod schema for instant feedback, but we never trust it.
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: "Please enter a valid email and password." };
  }

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  // Deliberately vague error message: don't reveal whether the email exists.
  if (!user) {
    return { success: false, error: "Invalid email or password." };
  }

  const passwordMatches = await verifyPassword(password, user.password);
  if (!passwordMatches) {
    return { success: false, error: "Invalid email or password." };
  }

  await createSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  });

  redirect("/dashboard");
}

export async function registerAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { success: false, error: firstIssue?.message ?? "Invalid input." };
  }

  const { name, email, password, role } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with that email already exists." };
  }

  const hashed = await hashPassword(password);
  const user = await db.user.create({
    data: { name, email, password: hashed, role: role as Role },
  });

  await createSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
