"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import type { SessionPayload } from "@/lib/session";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function titleFromPath(pathname: string) {
  if (pathname.startsWith("/tickets/create")) return "Create Ticket";
  if (pathname.match(/^\/tickets\/[^/]+$/)) return "Ticket Detail";
  if (pathname.startsWith("/tickets")) return "Tickets";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "Dashboard";
  const last = parts[parts.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
}

export function Header({ user }: { user: SessionPayload }) {
  const pathname = usePathname();
  const currentPage = titleFromPath(pathname);

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center text-sm">
        <span className="text-muted">HelpDesk</span>
        <span className="mx-2 text-border">›</span>
        <span className="text-white font-semibold">{currentPage}</span>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/tickets"
          className="relative hidden sm:block group"
          title="Search tickets"
        >
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-accent transition-colors" />
          <span className="block pl-9 pr-4 py-2.5 bg-surface-elevated border border-border rounded-xl text-sm text-muted w-56 group-hover:border-accent/30 transition-colors">
            Search tickets…
          </span>
        </Link>

        <div
          className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-black font-bold text-xs ring-2 ring-accent/20"
          title={user.email}
        >
          {initials(user.name)}
        </div>
      </div>
    </header>
  );
}
