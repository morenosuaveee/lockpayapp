import { Link } from "react-router-dom";
import { ChevronLeft, Mail, ShieldCheck, LifeBuoy, FileText, UserX } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LegalFooter, SUPPORT_EMAIL } from "@/components/layout/LegalFooter";

const FAQS = [
  {
    q: "How do conditional transfers work?",
    a: "A sender locks funds against an agreement. The funds release to the recipient only when both parties confirm the agreed condition has been met.",
  },
  {
    q: "What happens if the agreement isn't completed?",
    a: "If the agreement expires without both parties confirming release, funds are returned to the sender, minus non-refundable processing fees.",
  },
  {
    q: "Is LockPay a betting or gambling app?",
    a: "No. LockPay is a peer accountability and conditional payment platform. It does not facilitate gambling, wagering, or games of chance.",
  },
  {
    q: "How do I delete my account?",
    a: "Open Profile → Delete Account. We process verified deletion requests within 7 days.",
  },
];

export default function Support() {
  return (
    <AppShell>
      <div className="px-6 pt-4">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <h1 className="mt-4 text-2xl font-bold tracking-tight">Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We're here to help with your account, transfers, and agreements.
        </p>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition hover:bg-secondary/40"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <Mail className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Contact support</p>
            <p className="truncate text-xs text-muted-foreground">{SUPPORT_EMAIL}</p>
          </div>
        </a>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <Link to="/privacy" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-[11px] font-medium hover:bg-secondary/40">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Privacy
          </Link>
          <Link to="/terms" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-[11px] font-medium hover:bg-secondary/40">
            <FileText className="h-4 w-4 text-muted-foreground" /> Terms
          </Link>
          <Link to="/delete-account" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-[11px] font-medium hover:bg-secondary/40">
            <UserX className="h-4 w-4 text-muted-foreground" /> Delete
          </Link>
        </div>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Frequently asked
        </h2>
        <div className="mt-3 space-y-3">
          {FAQS.map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <p className="flex items-start gap-2 text-sm font-semibold">
                <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                {f.q}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
      <LegalFooter />
    </AppShell>
  );
}
