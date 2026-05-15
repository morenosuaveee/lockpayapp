import { Link } from "react-router-dom";
import {
  ChevronLeft,
  UserCheck,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Clock,
  Send,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LegalFooter } from "@/components/layout/LegalFooter";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: UserCheck,
    title: "Recipient verification",
    desc: "Before any transfer is initiated, we confirm the recipient's identity through phone-based verification and account checks. Anonymous transfers are never allowed.",
  },
  {
    icon: ShieldCheck,
    title: "Secure transfer coordination",
    desc: "Lock Pay coordinates the transfer between sender and recipient. Payment movement itself is performed by an independent, PCI-DSS compliant third-party processor.",
  },
  {
    icon: KeyRound,
    title: "Confirmation code",
    desc: "The recipient receives a unique confirmation code in-app and must approve the transfer to continue. This ensures only the intended person can complete it.",
  },
  {
    icon: CheckCircle2,
    title: "Transfer approval",
    desc: "Once both sender and recipient are verified and the recipient confirms, the transfer is approved and processed by our payment partner. You receive a real-time receipt.",
  },
  {
    icon: Clock,
    title: "Auto-cancel window",
    desc: "If the recipient doesn't confirm within 48 hours, the transfer request is automatically cancelled and any pending charge is reversed by the processor.",
  },
];

export default function HowItWorks() {
  return (
    <AppShell>
      <div className="px-6 pt-4">
        <Link
          to="/welcome"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            How it works
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Verified transfers, one secure step at a time
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Lock Pay is a transfer coordination and recipient verification platform. Every transfer
            is confirmed by both sides before it is processed.
          </p>
        </div>

        <ol className="mt-8 space-y-3">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Step {i + 1}
                  </p>
                  <h2 className="mt-0.5 text-sm font-semibold">{s.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Compliance disclaimer
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Lock Pay is a transfer coordination and recipient verification platform. Lock Pay is not
            a bank, money transmitter, escrow service, or custodial financial institution. Payment
            movement is performed exclusively by independent third-party processors.
          </p>
        </div>

        <div className="mt-6">
          <Link to="/signup">
            <Button className="h-12 w-full rounded-2xl text-sm font-semibold gradient-primary text-primary-foreground shadow-elevated active:scale-[0.98]">
              <Send className="mr-2 h-4 w-4" /> Start a verified transfer
            </Button>
          </Link>
          <Link to="/security" className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground">
            Learn more about our security model →
          </Link>
        </div>
      </div>
      <LegalFooter />
    </AppShell>
  );
}
