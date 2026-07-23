import { z } from "zod";

// These schemas are imported by both Client Components (React Hook Form's
// zodResolver, for instant inline feedback) and Server Actions (re-validated
// server-side before touching the database). Never trust the client copy.

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["MANAGER", "TECHNICAL", "EMPLOYEE"], {
    errorMap: () => ({ message: "Please select a role" }),
  }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const categoryValues = ["IT_SUPPORT", "FACILITIES", "HR", "OTHER"] as const;
export const priorityValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const statusValues = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;

export const createTicketSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Title must be under 150 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be under 5000 characters"),
  category: z.enum(categoryValues, {
    errorMap: () => ({ message: "Please select a category" }),
  }),
  priority: z.enum(priorityValues, {
    errorMap: () => ({ message: "Please select a priority" }),
  }),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const commentSchema = z.object({
  ticketId: z.string().min(1),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(3000, "Comment must be under 3000 characters"),
});
export type CommentInput = z.infer<typeof commentSchema>;

export const assignTicketSchema = z.object({
  ticketId: z.string().min(1),
  technicalUserId: z.string().min(1, "Please select a technical employee"),
});
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;

export const updateStatusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(statusValues),
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const updatePrioritySchema = z.object({
  ticketId: z.string().min(1),
  priority: z.enum(priorityValues),
});
export type UpdatePriorityInput = z.infer<typeof updatePrioritySchema>;

export const ticketFiltersSchema = z.object({
  status: z.enum(statusValues).optional(),
  priority: z.enum(priorityValues).optional(),
  category: z.enum(categoryValues).optional(),
  assignedTo: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["date_desc", "date_asc", "priority", "status"]).optional(),
});
export type TicketFilters = z.infer<typeof ticketFiltersSchema>;
