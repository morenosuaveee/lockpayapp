import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  UserCheck,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/layout/LegalFooter";

const steps = [
  {
    n: 1,
    icon: <Search className="h-5 w-5" />,
    title: "Enter recipient",
    desc: "Search by username, email, or phone number to start a transfer.",
  },
  {
    n: 2,
    icon: <UserCheck className="h-5 w-5" />,
    title: "Identity verification",
    desc: "Lock Pay confirms the intended recipient before a transfer can proceed.",
  },
  {
    n: 3,
    icon: <KeyRound className="h-5 w-5" />,
    title: "4-digit confirmation code",
    desc: "The recipient must confirm a secure 4-digit code before approval.",
  },
  {
    n: 4,
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "Transfer approved",
    desc: "Both parties confirm the transaction before completion.",
  },
];

export default function HowItWorks() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-background via-secondary/40 to-background">
      <div className="pointer-events-none absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-3xl" />
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-3">
          <Link to="/welcome" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <Button asChild size="sm" className="rounded-full px-4 gradient-primary text-primary-foreground hover:opacity-95">
            <Link to="/get-started">Send Money Securely</Link>
          </Button>
        </div>
      </header>

      <main className="page-enter relative mx-auto w-full max-w-3xl px-5 pb-20 pt-10 sm:pt-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-[11px] font-semibold text-accent-foreground">
            <ShieldCheck className="h-3 w-3" /> How LockPay Works
          </div>
          <h1 className="mt-5 text-balance text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight">
            Secure recipient verification before money moves.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
            Four simple steps designed to help prevent sending money to the wrong person.
          </p>
        </div>

        <ol className="mt-12 grid gap-3 sm:grid-cols-2">
          {steps.map((s) => (
            <li
              key={s.n}
              className="rounded-2xl border border-border/70 bg-card p-5 shadow-card transition hover:shadow-elevated"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  {s.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Step {s.n}
                </span>
              </div>
              <p className="mt-4 text-base font-semibold leading-tight">{s.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </li>
          ))}
        </ol>

        <section className="mt-14 grid gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-card sm:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold">Recipient verification</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Every payee must hold a Lock Pay account with a verified phone number and identity
              before they can receive a transfer. Unverified destinations cannot accept funds.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Confirmation code process</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Senders generate a secure 4-digit confirmation code. The recipient enters that code
              in-app to acknowledge the transfer before approval is recorded.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Transfer coordination</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Lock Pay coordinates the transfer flow between sender and recipient. Payment movement
              itself is handled by independent PCI-compliant third-party processors.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Approval logic</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Both parties must confirm: the sender authorizes, the recipient verifies the code.
              If either side cancels or no confirmation occurs within 48 hours, the request is
              cancelled.
            </p>
          </div>
        </section>

        <div className="mt-12 rounded-2xl border border-border/60 bg-secondary/40 p-5 text-[12px] leading-relaxed text-muted-foreground">
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p>
              <span className="font-semibold text-foreground">Compliance disclaimer.</span>{" "}
              Lock Pay is a transfer coordination and recipient verification platform. Lock Pay is
              not a bank, money transmitter, escrow service, or custodial financial institution.
              Payment movement is performed by independent third-party processors.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-2xl px-6 gradient-primary text-primary-foreground shadow-elevated hover:opacity-95"
          >
            <Link to="/get-started">
              Send Money Securely <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <LegalFooter />
      </main>
    </div>
  );
}
