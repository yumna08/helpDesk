import { TicketForm } from "./TicketForm";

export default function NewTicketPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">New Ticket</h1>
      <p className="mt-1 text-sm text-slate-500">
        Describe the issue and we&apos;ll route it to the right team.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <TicketForm />
      </div>
    </div>
  );
}
