import Link from "next/link";
import { LoginForm } from "./LoginForm";
import {
  Zap,
  Ticket,
  Users,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const WORKFLOW = [
  { step: "01", label: "Open" },
  { step: "02", label: "Assigned" },
  { step: "03", label: "In Progress" },
  { step: "04", label: "Resolved" },
];

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-glow-pulse absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="animate-glow-pulse absolute top-1/3 -right-32 h-[420px] w-[420px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="animate-glow-pulse absolute bottom-0 left-1/3 h-[280px] w-[280px] rounded-full bg-emerald-500/5 blur-[90px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(42,49,57,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(42,49,57,0.35)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
      </div>

      {/* Top brand bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12">
        <div className="animate-fade-in-up flex items-center gap-3">
          <div className="rounded-xl bg-accent p-2 text-black shadow-glow">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">HelpDesk</span>
        </div>
        <Link
          href="/register"
          className="btn-ghost gap-1.5 text-sm animate-fade-in-up"
        >
          Create account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {/* Hero + form */}
      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-6xl items-center gap-12 px-6 py-10 lg:grid-cols-2 lg:px-12 lg:py-16">
        {/* Left: hero composition */}
        <section className="space-y-10">
          <div className="animate-fade-in-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-dim px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Role-based ticketing
            </p>
            <h1 className="max-w-lg text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
              HelpDesk
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-text-secondary">
              Employees report. Tech resolves. Managers assign.
              One clean workflow from open to closed.
            </p>
          </div>

          {/* Workflow strip */}
          <div className="flex flex-wrap items-center gap-2">
            {WORKFLOW.map((item, i) => (
              <div
                key={item.step}
                className="animate-fade-in-up flex items-center gap-2"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="rounded-xl border border-border bg-surface px-3 py-2">
                  <div className="text-[10px] font-bold text-accent">{item.step}</div>
                  <div className="text-xs font-semibold text-white">{item.label}</div>
                </div>
                {i < WORKFLOW.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-muted" />
                )}
              </div>
            ))}
            <div
              className="animate-fade-in-up flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent-dim px-3 py-2"
              style={{ animationDelay: "360ms" }}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-bold text-accent">Closed</span>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                icon: Ticket,
                title: "Track issues",
                desc: "Priority & category",
              },
              {
                icon: Users,
                title: "Team workload",
                desc: "Assign with clarity",
              },
              {
                icon: ShieldCheck,
                title: "Role access",
                desc: "Manager · Tech · Emp",
              },
            ].map((f, index) => (
              <div
                key={f.title}
                className="animate-float-up-down group rounded-2xl border border-border bg-surface/80 p-4 backdrop-blur-sm transition-colors hover:border-accent/30 hover:bg-surface-elevated"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-accent-dim text-accent transition-colors group-hover:bg-accent group-hover:text-black">
                  <f.icon className="h-4 w-4" />
                </div>
                <div className="text-sm font-bold text-white">{f.title}</div>
                <div className="mt-0.5 text-xs text-muted">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: sign-in card */}
        <section className="w-full">
          <div className="card relative overflow-hidden p-8 shadow-glow sm:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Sign in to manage tickets and assignments
                </p>
              </div>

              <LoginForm />

              <p className="mt-8 text-center text-sm text-text-secondary">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-bold text-accent hover:text-accent/80"
                >
                  Request access
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
