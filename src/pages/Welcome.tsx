import { Link, Navigate } from "react-router-dom";
import {
  Lock,
  Shield,
  ShieldCheck,
  BadgeCheck,
  UserCheck,
  Eye,
  Bell,
  Send,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function Welcome() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-secondary/40 to-background">
      {/* Soft glow accents */}
      <div className="pointer-events-none absolute -top-32 -left-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-20 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />

      <div className="page-enter relative mx-auto w-full max-w-md px-6 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        {/* Top bar */}
        <div className="flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary shadow-elevated">
              <Lock className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
            </div>
            <span className="text-lg font-bold tracking-tight">LockPay</span>
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
            <ShieldCheck className="h-3 w-3" /> Verified-recipient transfers
          </div>
          <h1 className="mt-4 text-balance text-[34px] font-bold leading-[1.05] tracking-tight">
            Send money with
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              confidence.
            </span>
          </h1>
          <p className="mt-3 text-balance text-[15px] leading-relaxed text-muted-foreground">
            LockPay helps you send money safely from your phone — with recipient
            verification and a shared release code so funds reach the right
            person, every time.
          </p>

          {/* Transfer mockup */}
          <TransferMockup />

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
                <a href="#how-it-works">Learn more</a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 flex-1 rounded-2xl text-sm font-semibold bg-card active:scale-[0.98]"
              >
                <Link to="/signup">Join waitlist</Link>
              </Button>
            </div>
          </div>

          {/* Trust micro-row */}
          <div className="mt-5 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">
            <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> 256-bit secure</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="inline-flex items-center gap-1"><BadgeCheck className="h-3 w-3" /> Identity verified</span>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mt-14 animate-slide-up">
          <SectionHeader
            eyebrow="How it works"
            title="Four simple steps to a safer transfer."
          />
          <ol className="mt-5 space-y-3">
            <Step n={1} icon={<Send className="h-5 w-5" />} title="Enter recipient details" desc="Send to a phone number or email — we'll match it to a verified LockPay account." />
            <Step n={2} icon={<UserCheck className="h-5 w-5" />} title="Recipient verification" desc="We confirm the recipient's identity before any funds move. No mistaken transfers." />
            <Step n={3} icon={<KeyRound className="h-5 w-5" />} title="Secure delivery" desc="Funds are held safely until both of you enter the shared 4-digit release code." />
            <Step n={4} icon={<CheckCircle2 className="h-5 w-5" />} title="Tracking & confirmation" desc="Real-time status updates and a clean receipt the moment the transfer completes." />
          </ol>
        </section>

        {/* TRUST & SECURITY */}
        <section className="mt-14 animate-slide-up">
          <SectionHeader
            eyebrow="Trust & security"
            title="Built around your safety."
          />
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <TrustTile icon={<ShieldCheck className="h-5 w-5" />} label="Secure transactions" />
            <TrustTile icon={<BadgeCheck className="h-5 w-5" />} label="Verified recipients" />
            <TrustTile icon={<Lock className="h-5 w-5" />} label="Encrypted end-to-end" />
            <TrustTile icon={<Shield className="h-5 w-5" />} label="Fraud prevention" />
            <TrustTile icon={<Eye className="h-5 w-5" />} label="Real-time tracking" />
            <TrustTile icon={<Bell className="h-5 w-5" />} label="Protected payment flow" />
          </div>
        </section>

        {/* WHY LOCKPAY */}
        <section className="mt-14 animate-slide-up">
          <SectionHeader
            eyebrow="Why LockPay"
            title="Built for intentional, modern transfers."
          />
          <div className="mt-5 space-y-2.5">
            <Why title="Never send to the wrong person" desc="Recipient verification stops typos and mismatched accounts before they happen." />
            <Why title="Shared release code" desc="Both you and your recipient confirm — funds only move when you're both ready." />
            <Why title="Modern, mobile-first flow" desc="Designed for one-handed use on your phone, with the speed of a native app." />
            <Why title="Designed for trust" desc="Clear status, clear receipts, clear control. No surprises." />
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
              Create your account in under a minute. Verify your phone, send
              your first secure transfer.
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

        {/* COMPLIANCE FOOTER */}
        <footer className="mt-12 border-t border-border/60 pt-6 text-[11px] text-muted-foreground">
          <div className="mb-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
            <ShieldCheck className="h-3 w-3" />
            Secure money transfers
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <Link to="/support" className="hover:text-foreground">Support</Link>
            <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <a href="mailto:support@getlockpay.com" className="hover:text-foreground">support@getlockpay.com</a>
          </nav>
          <p className="mt-4 text-center text-[10.5px] leading-relaxed text-muted-foreground/85">
            <span className="font-semibold text-foreground/80">SMS notice.</span>{" "}
            By providing your phone number, you agree to receive transactional
            and account-related SMS messages from LockPay. Message &amp; data
            rates may apply. Reply STOP to unsubscribe.
          </p>
          <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground/70">
            LockPay is a secure peer-to-peer money transfer platform focused on
            recipient verification and intentional payments. LockPay does not
            facilitate gambling, wagering, or sports betting.
          </p>
          <p className="mt-3 text-center text-[10px] text-muted-foreground/60">
            © {new Date().getFullYear()} LockPay. All rights reserved.
          </p>
        </footer>
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

function Why({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function TransferMockup() {
  return (
    <div className="relative mt-6 overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-elevated">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/15 blur-2xl" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Send transfer
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
          <BadgeCheck className="h-3 w-3" /> Verified
        </span>
      </div>

      <div className="mt-3 text-center">
        <div className="text-[40px] font-bold leading-none tracking-tight tabular-nums">
          <span className="text-muted-foreground">$</span>240
          <span className="text-muted-foreground">.00</span>
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">USD · instant</div>
      </div>

      <div className="mt-4 rounded-2xl bg-secondary/60 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            JM
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Jordan Miles</p>
            <p className="truncate text-[11px] text-muted-foreground">+1 (415) ••• 0188 · verified</p>
          </div>
          <ShieldCheck className="h-4 w-4 text-accent" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-border/80 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5" /> Release code
        </span>
        <span className="font-semibold tracking-[0.3em] text-foreground">4 8 2 1</span>
      </div>
    </div>
  );
}
