import { TicketForm } from "./TicketForm";

export default function NewTicketPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="page-title">Create New Ticket</h1>
        <p className="page-subtitle">
          Describe your issue and we&apos;ll route it to the right team.
        </p>
      </div>
      <TicketForm />
    </div>
  );
}
