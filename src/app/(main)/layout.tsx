import { DashboardLayout } from "@/components/DashboardLayout";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  let where: Prisma.TicketWhereInput;
  if (session.role === "TECHNICAL") {
    where = {
      assignedToId: session.userId,
      status: { in: ["ASSIGNED", "IN_PROGRESS"] },
    };
  } else if (session.role === "EMPLOYEE") {
    where = {
      createdById: session.userId,
      status: { in: ["OPEN", "RESOLVED"] },
    };
  } else {
    where = {
      status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] },
    };
  }

  const openTicketCount = await db.ticket.count({ where });

  return (
    <DashboardLayout user={session} openTicketCount={openTicketCount}>
      {children}
    </DashboardLayout>
  );
}
