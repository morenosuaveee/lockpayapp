import { Link } from "react-router-dom";
import { ChevronLeft, Mail, ShieldCheck, LifeBuoy, FileText, UserX } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LegalFooter, SUPPORT_EMAIL } from "@/components/layout/LegalFooter";

const FAQS = [
  {
    q: "How do verified transfers work?",
    a: "Enter your recipient's phone or email. We confirm their identity matches a verified LockPay account, then both sides enter a shared 4-digit confirmation code so the transfer reaches the person you actually intend to send to.",
  },
  {
    q: "How does recipient verification help me?",
    a: "Before a transfer is initiated, we confirm the recipient matches a verified LockPay account. This is designed to help reduce mistaken transfers caused by typos, mismatched accounts, and impersonation attempts.",
  },
  {
    q: "What if the transfer isn't completed?",
    a: "If the confirmation code isn't entered within the window, the transfer request is cancelled and any pending charge is reversed by the payment processor according to its standard timelines. Non-refundable processor fees may apply.",
  },
  {
    q: "Will I receive SMS messages?",
    a: "Yes — for verification codes, transfer status, and security alerts. Message & data rates may apply. Reply STOP at any time to unsubscribe.",
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
