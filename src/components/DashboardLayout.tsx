import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import type { SessionPayload } from "@/lib/session";

export function DashboardLayout({
  children,
  user,
  openTicketCount = 0,
}: {
  children: React.ReactNode;
  user: SessionPayload;
  openTicketCount?: number;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} openTicketCount={openTicketCount} />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header user={user} />
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
