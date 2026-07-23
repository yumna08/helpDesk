import { PrismaClient, Category, Priority, Status } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const PASSWORD = "password123";

async function main() {
  console.log("Seeding database...");

  // Clean slate for repeatable seeding.
  await db.activity.deleteMany();
  await db.comment.deleteMany();
  await db.ticket.deleteMany();
  await db.user.deleteMany();

  const hashed = await bcrypt.hash(PASSWORD, 10);

  const manager1 = await db.user.create({
    data: { email: "manager1@company.com", password: hashed, name: "Morgan Lee", role: "MANAGER" },
  });
  const manager2 = await db.user.create({
    data: { email: "manager2@company.com", password: hashed, name: "Priya Shah", role: "MANAGER" },
  });

  const tech1 = await db.user.create({
    data: { email: "tech1@company.com", password: hashed, name: "Sam Rivera", role: "TECHNICAL" },
  });
  const tech2 = await db.user.create({
    data: { email: "tech2@company.com", password: hashed, name: "Jordan Kim", role: "TECHNICAL" },
  });
  const tech3 = await db.user.create({
    data: { email: "tech3@company.com", password: hashed, name: "Casey Nguyen", role: "TECHNICAL" },
  });

  const emp1 = await db.user.create({
    data: { email: "emp1@company.com", password: hashed, name: "Alex Turner", role: "EMPLOYEE" },
  });
  const emp2 = await db.user.create({
    data: { email: "emp2@company.com", password: hashed, name: "Bailey Chen", role: "EMPLOYEE" },
  });
  const emp3 = await db.user.create({
    data: { email: "emp3@company.com", password: hashed, name: "Dana Okafor", role: "EMPLOYEE" },
  });

  console.log("Created 8 users.");

  type SeedTicket = {
    seq: number;
    title: string;
    description: string;
    category: Category;
    priority: Priority;
    status: Status;
    createdBy: typeof emp1;
    assignedTo?: typeof tech1;
    comments?: { author: typeof emp1; content: string }[];
    resolved?: boolean;
    closed?: boolean;
  };

  const tickets: SeedTicket[] = [
    {
      seq: 1,
      title: "Laptop won't power on after update",
      description:
        "Installed the mandatory Windows update last night and now the laptop won't boot past the manufacturer logo. Tried holding power button for 10s, no change.",
      category: "IT_SUPPORT",
      priority: "CRITICAL",
      status: "OPEN",
      createdBy: emp1,
    },
    {
      seq: 2,
      title: "VPN disconnects every 10 minutes",
      description:
        "Since switching to the new office wifi, my VPN client drops the connection roughly every 10 minutes, forcing me to log back in. Happens on both the laptop and desktop.",
      category: "IT_SUPPORT",
      priority: "HIGH",
      status: "ASSIGNED",
      createdBy: emp2,
      assignedTo: tech1,
    },
    {
      seq: 3,
      title: "Conference room B projector not turning on",
      description:
        "The HDMI and power cables are both connected but the projector in conference room B shows no signal and the power light doesn't turn on at all.",
      category: "FACILITIES",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      createdBy: emp3,
      assignedTo: tech2,
      comments: [
        { author: tech2, content: "Checked the power outlet - it's dead. Requesting an electrician." },
      ],
    },
    {
      seq: 4,
      title: "Need access to shared finance drive",
      description:
        "I was recently moved to the finance team and still don't have read/write access to the shared finance drive on the file server.",
      category: "IT_SUPPORT",
      priority: "MEDIUM",
      status: "RESOLVED",
      createdBy: emp1,
      assignedTo: tech3,
      resolved: true,
      comments: [
        { author: tech3, content: "Added you to the Finance-RW group. Please log out and back in to refresh permissions." },
      ],
    },
    {
      seq: 5,
      title: "Broken chair in open office area",
      description:
        "One of the chairs near desk cluster C has a broken wheel and tips backward. Marked it with a sticky note so no one sits in it.",
      category: "FACILITIES",
      priority: "LOW",
      status: "CLOSED",
      createdBy: emp2,
      assignedTo: tech1,
      resolved: true,
      closed: true,
      comments: [
        { author: tech1, content: "Replaced the chair with a spare from storage." },
        { author: emp2, content: "Confirmed, new chair works great. Thank you!" },
      ],
    },
    {
      seq: 6,
      title: "Payroll direct deposit went to old bank account",
      description:
        "I updated my direct deposit info two weeks ago but this month's paycheck still went to my old, closed bank account.",
      category: "HR",
      priority: "CRITICAL",
      status: "ASSIGNED",
      createdBy: emp3,
      assignedTo: tech2,
    },
    {
      seq: 7,
      title: "Printer on 3rd floor jams constantly",
      description:
        "The Xerox printer near the 3rd floor kitchen jams on almost every print job, usually with a paper feed error on tray 2.",
      category: "FACILITIES",
      priority: "MEDIUM",
      status: "OPEN",
      createdBy: emp1,
    },
    {
      seq: 8,
      title: "Requesting second monitor for new hire",
      description:
        "Our new hire starting Monday still needs a second monitor set up at their desk (row 4, desk 12).",
      category: "IT_SUPPORT",
      priority: "LOW",
      status: "OPEN",
      createdBy: emp2,
    },
    {
      seq: 9,
      title: "Can't reset password - reset email never arrives",
      description:
        "I've requested a password reset for the internal portal five times over the last hour and never receive the reset email, even checking spam.",
      category: "IT_SUPPORT",
      priority: "HIGH",
      status: "IN_PROGRESS",
      createdBy: emp3,
      assignedTo: tech3,
      comments: [
        { author: tech3, content: "Looks like your account email has a typo in the domain. Fixing now." },
      ],
    },
    {
      seq: 10,
      title: "Question about parental leave policy",
      description:
        "Could someone walk me through how parental leave interacts with accrued PTO? The handbook section is a little ambiguous for my situation.",
      category: "HR",
      priority: "LOW",
      status: "RESOLVED",
      createdBy: emp1,
      assignedTo: tech1,
      resolved: true,
      comments: [
        { author: tech1, content: "Routed this to HR specialists; see attached policy summary emailed to you." },
      ],
    },
    {
      seq: 11,
      title: "Office AC blowing warm air on 2nd floor",
      description:
        "The air conditioning on the entire 2nd floor has been blowing warm air since this morning. It's getting uncomfortable for the whole team.",
      category: "FACILITIES",
      priority: "HIGH",
      status: "ASSIGNED",
      createdBy: emp2,
      assignedTo: tech2,
    },
    {
      seq: 12,
      title: "Software license expired for design tools",
      description:
        "The whole design team's Figma/Adobe licenses show as expired as of this morning, blocking all of our work.",
      category: "IT_SUPPORT",
      priority: "CRITICAL",
      status: "RESOLVED",
      createdBy: emp3,
      assignedTo: tech3,
      resolved: true,
      comments: [
        { author: tech3, content: "Renewed the license subscription, should propagate within 15 minutes." },
      ],
    },
    {
      seq: 13,
      title: "Mislabeled expense category in reimbursement tool",
      description:
        "My travel reimbursement was categorized as 'Other' instead of 'Travel', which is affecting my budget reporting.",
      category: "OTHER",
      priority: "LOW",
      status: "OPEN",
      createdBy: emp1,
    },
    {
      seq: 14,
      title: "Onboarding laptop missing required software",
      description:
        "The laptop issued to me on day one is missing the standard dev toolchain (git, docker, VS Code) that IT usually preinstalls.",
      category: "IT_SUPPORT",
      priority: "MEDIUM",
      status: "CLOSED",
      createdBy: emp2,
      assignedTo: tech1,
      resolved: true,
      closed: true,
      comments: [
        { author: tech1, content: "Pushed the standard dev image remotely, all tools should be installed now." },
        { author: emp2, content: "Confirmed everything is installed. Closing this out." },
      ],
    },
  ];

  for (const t of tickets) {
    const ticket = await db.ticket.create({
      data: {
        seq: t.seq,
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        createdById: t.createdBy.id,
        assignedToId: t.assignedTo?.id ?? null,
        resolvedAt: t.resolved ? new Date() : null,
        closedAt: t.closed ? new Date() : null,
        activities: {
          create: {
            actorId: t.createdBy.id,
            type: "CREATED",
            description: `Ticket created by ${t.createdBy.name}.`,
          },
        },
      },
    });

    if (t.comments?.length) {
      await db.comment.createMany({
        data: t.comments.map((comment) => ({
          ticketId: ticket.id,
          authorId: comment.author.id,
          content: comment.content,
        })),
      });
    }
  }

  console.log("Created seed tickets.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
