import Link from "next/link";
import { RegisterForm } from "./RegisterForm";
import { Zap } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="bg-accent text-black p-2 rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">HelpDesk</span>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-white">Create an account</h1>
          <p className="mt-1 text-sm text-text-secondary">Register for helpdesk access.</p>
          <RegisterForm />
          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-accent hover:text-accent/80">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
