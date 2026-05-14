import { Link, Navigate } from "react-router-dom";
import {
  Lock,
  Shield,
  ShieldCheck,
  BadgeCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileSignature,
  Lock as LockIcon,
  Users,
  Smartphone,
  Apple,
  LifeBuoy,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/layout/LegalFooter";

export default function Welcome() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-secondary/40 to-background">
      <div className="pointer-events-none absolute -top-32 -left-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-20 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />

      <div className="page-enter relative mx-auto w-full max-w-md px-6 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        {/* Top bar */}
        <div className="flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary shadow-elevated">
              <Lock className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
            </div>
            <span className="text-lg font-bold tracking-tight">Lock Pay</span>
          </div>
          <Link
            to="/login"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground active:scale-95 transition"
          >
            Log in
          </Link>
        </div>

        {/* HERO */}
        <section className="mt-8 animate-slide-up">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-[11px] font-medium text-accent-foreground">
            <ShieldCheck className="h-3 w-3" /> Dual confirmation protection
          </div>
          <h1 className="mt-4 text-balance text-[34px] font-bold leading-[1.05] tracking-tight">
            Secure
            <br />
            Accountability-Based
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Payments.
            </span>
          </h1>
          <p className="mt-3 text-balance text-[15px] leading-relaxed text-muted-foreground">
            Send protected payments with dual confirmation security. Lock Pay adds an extra layer
            of protection by requiring both parties to confirm before funds are released.
          </p>

          <PaymentMockup />

          {/* Primary CTAs */}
          <div className="mt-5 space-y-2.5">
            <Button
              asChild
              className="h-14 w-full rounded-2xl text-base font-semibold gradient-primary text-primary-foreground shadow-elevated hover:opacity-95 active:scale-[0.98]"
            >
              <Link to="/signup">
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <div className="flex gap-2.5">
              <Button
                asChild
                variant="outline"
                className="h-12 flex-1 rounded-2xl text-sm font-semibold bg-card active:scale-[0.98]"
              >
                <a href="#how-it-works">
                  <Apple className="mr-1.5 h-4 w-4" /> Download App
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 flex-1 rounded-2xl text-sm font-semibold bg-card active:scale-[0.98]"
              >
                <Link to="/contact">
                  <LifeBuoy className="mr-1.5 h-4 w-4" /> Contact Support
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">
            <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> 256-bit secure</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="inline-flex items-center gap-1"><BadgeCheck className="h-3 w-3" /> Dual confirmation</span>
          </div>
        </section>

        {/* HOW IT WORKS — 3 STEPS */}
        <section id="how-it-works" className="mt-14 animate-slide-up">
          <SectionHeader
            eyebrow="How it works"
            title="Three steps to a protected payment."
          />
          <ol className="mt-5 space-y-3">
            <Step n={1} icon={<FileSignature className="h-5 w-5" />} title="Create Agreement" desc="Define payment expectations between both parties before funds are sent." />
            <Step n={2} icon={<LockIcon className="h-5 w-5" />} title="Secure Transaction" desc="Lock Pay protects the payment process with confirmation-based release controls." />
            <Step n={3} icon={<Users className="h-5 w-5" />} title="Dual Confirmation" desc="Funds are released only after both users confirm completion." />
          </ol>
        </section>

        {/* TRUST */}
        <section className="mt-14 animate-slide-up">
          <SectionHeader
            eyebrow="Trust & security"
            title="Built for confidence at every step."
          />
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <TrustTile icon={<ShieldCheck className="h-5 w-5" />} label="Secure Transactions" />
            <TrustTile icon={<Users className="h-5 w-5" />} label="Dual Confirmation Protection" />
            <TrustTile icon={<Shield className="h-5 w-5" />} label="Fraud Reduction Focused" />
            <TrustTile icon={<Smartphone className="h-5 w-5" />} label="Built for Modern Payments" />
          </div>
        </section>

        {/* HOW LOCK PAY WORKS — informational */}
        <section className="mt-14 animate-slide-up">
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-elevated">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              The platform
            </div>
            <h2 className="mt-1.5 text-balance text-[22px] font-bold leading-tight tracking-tight">
              How Lock Pay Works
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Lock Pay is designed to create safer peer-to-peer payment coordination by adding a
              dual-confirmation layer before transactions finalize. Both parties review the
              agreement, the payment is held under confirmation controls, and funds release only
              when both sides confirm — so every payment moves with intent.
            </p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mt-14 animate-slide-up">
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-elevated">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Ready when you are
            </div>
            <h3 className="mt-2 text-xl font-bold tracking-tight">
              Start sending with confidence.
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Create your account in under a minute. Verify your phone, send your first protected
              payment.
            </p>
            <Button
              asChild
              className="mt-4 h-14 w-full rounded-2xl text-base font-semibold gradient-primary text-primary-foreground shadow-elevated hover:opacity-95 active:scale-[0.98]"
            >
              <Link to="/signup">Create account</Link>
            </Button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              By continuing you agree to our{" "}
              <Link to="/terms" className="underline">Terms</Link> &amp;{" "}
              <Link to="/privacy" className="underline">Privacy</Link>.
            </p>
          </div>
        </section>

        <LegalFooter />
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {eyebrow}
      </div>
      <h2 className="mt-1.5 text-balance text-[22px] font-bold leading-tight tracking-tight">
        {title}
      </h2>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  desc,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        {icon}
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-card">
          {n}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </li>
  );
}

function TrustTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl bg-card p-3.5 shadow-card">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent-foreground">
        {icon}
      </div>
      <span className="text-[12px] font-semibold leading-tight">{label}</span>
    </div>
  );
}

function PaymentMockup() {
  return (
    <div className="relative mt-6 overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-elevated backdrop-blur">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/15 blur-2xl" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Protected payment
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
          <BadgeCheck className="h-3 w-3" /> Dual confirm
        </span>
      </div>

      <div className="mt-3 text-center">
        <div className="text-[40px] font-bold leading-none tracking-tight tabular-nums">
          <span className="text-muted-foreground">$</span>240
          <span className="text-muted-foreground">.00</span>
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">USD · awaiting confirmation</div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-accent" />
          <span className="text-[12px] font-medium">Sender confirmed</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-secondary/40 px-3 py-2">
          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />
          <span className="text-[12px] font-medium text-muted-foreground">Awaiting recipient confirmation</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-border/80 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" /> Released on dual confirm
        </span>
        <span className="font-semibold tracking-wider text-foreground">Secure</span>
      </div>
    </div>
  );
}
