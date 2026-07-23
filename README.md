# Helpdesk Management System

A role-based helpdesk ticketing system built with Next.js 14 (App Router), TypeScript, Prisma/PostgreSQL, and Server Actions.

## Stack

- **Framework:** Next.js 14 (App Router), Server Components + Server Actions (no API routes)
- **Language:** TypeScript
- **ORM:** Prisma (PostgreSQL)
- **Forms:** React Hook Form + Zod (schemas shared between client and server)
- **Auth:** JWT in an httpOnly cookie, verified in `middleware.ts`
- **Styling:** Tailwind CSS

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — any PostgreSQL connection string (**Docker is optional**, not required).
  - **Hosted (recommended for demos):** Neon, Supabase, Railway, etc.
  - **Local Postgres:** `postgresql://postgres:postgres@localhost:5432/helpdesk?schema=public`
  - **Optional Docker Postgres:** `docker run --name helpdesk-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=helpdesk -p 5432:5432 -d postgres:16`
- `JWT_SECRET` — any long random string, e.g. `openssl rand -base64 32`.

### 3. Create the database schema

```bash
npx prisma migrate dev --name init
```

This also runs `npx prisma generate` automatically.

### 4. Seed sample data

```bash
npm run seed
```

This creates 8 users and ~14 tickets in various workflow states. All seeded users share the password `password123`:

| Role | Emails |
|---|---|
| Manager | `manager1@company.com`, `manager2@company.com` |
| Technical | `tech1@company.com`, `tech2@company.com`, `tech3@company.com` |
| Employee | `emp1@company.com`, `emp2@company.com`, `emp3@company.com` |

### 5. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000` and log in with any seeded account (or register a new one).

## Project structure

```
prisma/
  schema.prisma        # data model
  seed.ts               # seed script
src/
  actions/               # Server Actions ("use server") — the only data-mutation entry points
    auth.ts               # login / register / logout
    tickets.ts             # create / assign / status transitions / priority / comments
  lib/
    db.ts                  # Prisma client singleton
    auth.ts                # password hashing + cookie helpers (Node-only, "server-only")
    session.ts              # JWT sign/verify (Edge-safe, used by both auth.ts and middleware.ts)
    validations.ts           # Zod schemas shared by forms and Server Actions
    permissions.ts            # single source of truth for role-based rules
    utils.ts                   # formatting helpers, label/color maps
  middleware.ts             # route protection (redirects unauthenticated users)
  app/
    login/, register/         # auth pages
    (main)/
      layout.tsx               # authenticated shell (sidebar + header)
      dashboard/               # role-specific dashboard (Manager / Technical / Employee)
      tickets/                 # list (filter/sort/search), create, [id] (detail)
  components/                  # shared UI (badges, tables, filters, layout)
```

## Design decisions (for interview discussion)

**Database schema.** `User` has a single `role` enum rather than separate tables per role, since permissions are the only thing that differs — this keeps queries and relations simple. `Ticket` has a numeric `seq` (auto-increment) separate from its `id` (cuid), so ticket numbers (`TKT-001`) are stable and human-friendly without racing on a "count rows" approach. `Activity` is a normalized audit-log table separate from `Comment`, so the timeline can interleave both without conflating "an update happened" with "someone left a note."

**Role-based permissions.** Centralized in `src/lib/permissions.ts` (`canTransition`, `canAssignTicket`, `canComment`, `canViewTicket`). Both the UI (to hide/show buttons) and every Server Action (to actually authorize the mutation) call these same functions, so there's one source of truth instead of duplicated role checks drifting apart over time.

**Validation strategy.** Zod schemas in `src/lib/validations.ts` are imported by both React Hook Form (via `zodResolver`, for instant inline errors) and by the Server Actions themselves (`schema.safeParse(...)`), which re-validate before touching the database. Client validation is UX only — it is never trusted as the actual gate.

**Server Actions.** All mutations are `"use server"` functions in `src/actions/`, each: re-derives the session from the httpOnly cookie (never trusts client-passed identity), re-validates input with Zod, re-checks permissions, performs the mutation (often in a `db.$transaction` alongside an `Activity` row), and calls `revalidatePath` so Server Components refetch fresh data.

**"Optimistic" updates.** Rather than true optimistic UI (which risks showing state that a server-side permission check later rejects), pending states are shown via `useTransition` + a disabled/pending button, and `router.refresh()` re-fetches the Server Component tree once the action confirms success. This trades a few hundred ms of perceived latency for never showing the user a state that didn't actually happen — appropriate for a workflow tool where incorrect status is worse than a instant-feeling UI.

**Error handling.** Server Actions return a typed `{ success, error }` result instead of throwing for expected failure modes (bad input, permission denied, invalid transition), so the UI can render a specific inline message. Unexpected errors (DB down, etc.) surface via Next.js's error boundaries.

**Security considerations.** Passwords are hashed with bcrypt (cost 10). Session tokens are signed JWTs in an httpOnly, `sameSite=lax`, `secure`-in-production cookie — never accessible to client JS. `middleware.ts` verifies the JWT on every request and redirects unauthenticated users before any page renders. Every Server Action re-derives the user from the cookie server-side rather than trusting any client-supplied user ID. Ticket detail lookups return a 404 (not a 403) for tickets a role can't view, to avoid confirming a ticket ID exists to someone unauthorized to see it. Login errors are deliberately vague ("Invalid email or password") to avoid leaking which emails are registered.

**Performance.** List/dashboard queries use Prisma `select` to fetch only the fields the UI needs (avoiding over-fetching relations). Dashboard stat cards run as parallel `Promise.all` count queries rather than fetching full rows and counting in JS. Indexes are added on `Ticket.status`, `.assignedToId`, `.createdById`, and `.priority` since these are the columns every filter/dashboard query touches.
