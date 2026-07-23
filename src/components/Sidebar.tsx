"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Ticket, Plus, Zap, LogOut } from "lucide-react";
import clsx from "clsx";
import { logoutAction } from "@/actions/auth";
import type { SessionPayload } from "@/lib/session";

const ROLE_LABELS: Record<string, string> = {
  MANAGER: "Manager",
  TECHNICAL: "Technical",
  EMPLOYEE: "Employee",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export function Sidebar({
  user,
  openTicketCount,
}: {
  user: SessionPayload;
  openTicketCount: number;
}) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    {
      name: "Tickets",
      icon: Ticket,
      href: "/tickets",
      badge: openTicketCount > 0 ? openTicketCount : undefined,
    },
    { name: "Create Ticket", icon: Plus, href: "/tickets/create" },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0 z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-accent text-black p-2 rounded-xl">
          <Zap className="w-5 h-5" />
        </div>
        <span className="font-bold text-xl text-white tracking-tight">HelpDesk</span>
      </div>

      <div className="px-4 pb-4 flex-1">
        <div className="text-[10px] font-bold text-muted mb-4 px-2 uppercase tracking-widest">
          Menu
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "nav-link",
                  isActive ? "nav-link-active" : "nav-link-inactive"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={clsx(
                      "w-5 h-5",
                      isActive ? "text-accent" : "text-muted"
                    )}
                  />
                  {item.name}
                </div>
                {item.badge !== undefined && (
                  <span
                    className={clsx(
                      "px-2 py-0.5 rounded-full text-xs font-bold",
                      isActive
                        ? "bg-accent text-black"
                        : "bg-surface-elevated text-accent border border-accent/20"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-surface-elevated border border-border">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-black font-bold text-sm shrink-0">
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">{user.name}</div>
            <div className="text-xs font-semibold text-accent mt-0.5">
              {ROLE_LABELS[user.role] ?? user.role}
            </div>
          </div>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn-ghost w-full justify-start gap-2">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
