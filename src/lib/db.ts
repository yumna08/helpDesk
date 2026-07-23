import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton pattern to avoid exhausting the
// Postgres connection pool from hot-reload creating new PrismaClients.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
