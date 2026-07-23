import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

const ROLE_LABELS: Record<string, string> = {
  MANAGER: "Manager",
  TECHNICAL: "Technical",
  EMPLOYEE: "Employee",
};

export async function Nav() {
  const session = await getSession();
  if (!session) return null;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
            Helpdesk
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <Link href="/dashboard" className="hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/tickets" className="hover:text-slate-900">
              Tickets
            </Link>
            {session.role === "EMPLOYEE" && (
              <Link href="/tickets/new" className="hover:text-slate-900">
                New Ticket
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="text-right">
            <div className="font-medium text-slate-900">{session.name}</div>
            <div className="text-xs text-slate-500">{ROLE_LABELS[session.role]}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
