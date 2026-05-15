import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Lock,
  ShieldCheck,
  BadgeCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  UserCheck,
  Fingerprint,
  EyeOff,
  ChevronDown,
  LifeBuoy,
  Mail,
  Search,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/layout/LegalFooter";

export default function Welcome() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-secondary/40 to-background">
      <div className="pointer-events-none absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute top-32 -right-32 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-3xl" />

      <TopBar />

      <main className="page-enter relative mx-auto w-full max-w-6xl px-5 sm:px-8 pb-[max(env(safe-area-inset-bottom),2rem)]">
        <Hero />
        <HowItWorks />
        <Security />
        <Trust />
        <Faq />
        <FinalCta />
        <LegalFooter />
      </main>

      <StickyMobileCta />
    </div>
  );
}

/* ------------------------- Top bar ------------------------- */

function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 sm:px-8 py-3">
        <Link to="/welcome" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl gradient-primary shadow-elevated">
            <Lock className="h-4 w-4 text-primary-foreground" strokeWidth={2.4} />
          </div>
          <span className="text-base font-bold tracking-tight">Lock Pay</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#security" className="hover:text-foreground transition">Security</a>
          <a href="#faq" className="hover:text-foreground transition">FAQ</a>
          <Link to="/contact" className="hover:text-foreground transition">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground transition"
          >
            Log in
          </Link>
          <Button
            asChild
            size="sm"
            className="rounded-full px-4 gradient-primary text-primary-foreground hover:opacity-95"
          >
            <Link to="/get-started">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------- Hero ------------------------- */

function Hero() {
  return (
    <section className="pt-12 sm:pt-20 md:pt-24">
      <div className="mx-auto max-w-3xl text-center animate-slide-up">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-[11px] font-semibold text-accent-foreground">
          <ShieldCheck className="h-3 w-3" /> Identity-confirmed transfer coordination
        </div>
        <h1 className="mt-5 text-balance text-[40px] sm:text-[60px] font-bold leading-[1.02] tracking-tight">
          Verify before you{" "}
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            send
          </span>
          .
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-[16px] sm:text-[18px] leading-relaxed text-muted-foreground">
          Lock Pay helps prevent sending money to the wrong person. We confirm the
          recipient's identity before any transfer can move.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-14 w-full sm:w-auto rounded-2xl px-8 text-base font-semibold gradient-primary text-primary-foreground shadow-elevated hover:opacity-95 active:scale-[0.99] transition"
          >
            <Link to="/get-started">
              <ShieldCheck className="mr-1.5 h-5 w-5" />
              Send Money Securely
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="h-14 rounded-2xl px-6 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <Link to="/how-it-works">
              See how it works <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="mt-4 inline-flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground">
          <Lock className="h-3 w-3" /> Identity verification required before any transfer.
        </p>

        <div className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-4">
          <Stat label="Recipient match" value="100%" />
          <Stat label="Encryption" value="256-bit" />
          <Stat label="Verification" value="Required" />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xl font-bold tracking-tight">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
    </div>
  );
}

/* ------------------------- How it works ------------------------- */

function HowItWorks() {
  const steps = [
    {
      n: 1,
      title: "Enter recipient",
      desc: "Search by username, email, or phone number.",
      icon: <Search className="h-5 w-5" />,
    },
    {
      n: 2,
      title: "Identity verification",
      desc: "Lock Pay confirms the intended recipient before a transfer can proceed.",
      icon: <UserCheck className="h-5 w-5" />,
    },
    {
      n: 3,
      title: "4-digit confirmation code",
      desc: "The recipient must confirm a secure 4-digit code before approval.",
      icon: <KeyRound className="h-5 w-5" />,
    },
    {
      n: 4,
      title: "Transfer approved",
      desc: "Both parties confirm the transaction before completion.",
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
  ];
  return (
    <section id="how" className="mt-24">
      <SectionHeader
        eyebrow="How LockPay Works"
        title="Secure recipient verification before money moves."
      />
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div
            key={s.n}
            className="relative rounded-2xl border border-border/70 bg-card p-5 shadow-card transition hover:shadow-elevated"
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
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          to="/how-it-works"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Read the full flow <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

/* ------------------------- Security ------------------------- */

function Security() {
  const items = [
    { icon: <ShieldCheck className="h-5 w-5" />, title: "Recipient verification", desc: "Every payee is matched to a verified account before a transfer is initiated." },
    { icon: <Lock className="h-5 w-5" />, title: "256-bit encryption", desc: "Industry-standard encryption on every transfer, in transit and at rest." },
    { icon: <Fingerprint className="h-5 w-5" />, title: "Secure authentication", desc: "Biometric and OTP-secured logins keep your account yours." },
    { icon: <EyeOff className="h-5 w-5" />, title: "Mistake prevention", desc: "Designed to help reduce mistaken transfers through identity confirmation." },
  ];
  return (
    <section id="security" className="mt-24">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <SectionHeader eyebrow="Security" title="Built around identity confirmation." />
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground max-w-md">
            Lock Pay combines recipient verification, encryption, and modern authentication
            into a simple, mobile-first transfer flow.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button asChild className="rounded-2xl gradient-primary text-primary-foreground hover:opacity-95">
              <Link to="/get-started">Open a secure account</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-2xl">
              <Link to="/security">Security center</Link>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-border/70 bg-card p-4 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-foreground">
                {it.icon}
              </div>
              <p className="mt-3 text-sm font-semibold">{it.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Trust ------------------------- */

function Trust() {
  const pillars = [
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Built on accountability",
      desc: "Every transfer is tied to a verified sender and recipient — no anonymous activity.",
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: "Verification-first workflow",
      desc: "Recipient identity is confirmed before a transfer is initiated, helping reduce mistaken transfers.",
    },
    {
      icon: <BadgeCheck className="h-5 w-5" />,
      title: "Industry-standard infrastructure",
      desc: "Payment movement is performed by independent third-party processors. Authentication uses industry-standard providers.",
    },
  ];
  return (
    <section className="mt-24">
      <SectionHeader eyebrow="Why senders trust Lock Pay" title="Designed around verification, not assumptions." />
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {pillars.map((p) => (
          <div key={p.title} className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-foreground">
              {p.icon}
            </div>
            <p className="mt-4 text-sm font-semibold">{p.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Encrypted in transit</span>
        <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5" /> Verified recipients</span>
        <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Confirmation-based workflow</span>
        <span className="inline-flex items-center gap-1.5"><Fingerprint className="h-3.5 w-3.5" /> Secure authentication</span>
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-center text-[11px] leading-relaxed text-muted-foreground/80">
        Lock Pay is a technology platform for secure transfer coordination and recipient
        verification. Lock Pay is not a bank, money transmitter, escrow agent, or insured financial
        institution and does not hold customer funds. Payment movement is performed by independent
        third-party processors. Availability and features may vary by region and account status.
      </p>
    </section>
  );
}

/* ------------------------- FAQ ------------------------- */

function Faq() {
  const items = [
    {
      q: "How does Lock Pay's transfer workflow work?",
      a: "When you initiate a transfer, Lock Pay first matches the recipient to a verified Lock Pay account and asks them to confirm a secure 4-digit code in-app. Payment movement itself is handled by our independent third-party payment processor. The verification step is designed to help reduce mistaken transfers.",
    },
    {
      q: "What happens if I send to the wrong username, email, or phone?",
      a: "If the destination doesn't match a verified Lock Pay account, the transfer is not initiated and the request is cancelled. If a recipient match is found but they don't confirm within 48 hours, the request is cancelled and any pending charge by the payment processor is reversed.",
    },
    {
      q: "How fast are transfers?",
      a: "Once both sides are verified and the recipient confirms in-app, Lock Pay marks the transfer complete near-instantly. Actual settlement of funds in the recipient's external account follows your payment processor's standard timelines and may take 1–3 business days.",
    },
    {
      q: "Are recipients actually verified?",
      a: "Yes. Recipients must have a Lock Pay account with a verified phone number and identity details before they can receive a transfer. Unverified destinations cannot accept a Lock Pay transfer.",
    },
    {
      q: "Is Lock Pay secure?",
      a: "Traffic is encrypted in transit with TLS 1.2+, sensitive data is encrypted at rest, and authentication uses industry-standard providers with phone-based verification. Card details are tokenized by our PCI-compliant payment processor — Lock Pay never stores raw card numbers.",
    },
    {
      q: "Is Lock Pay a bank or escrow service?",
      a: "No. Lock Pay is a technology platform that coordinates peer-to-peer transfers and verifies recipients. Lock Pay is not a bank, money transmitter, escrow agent, or insured financial institution and does not hold customer funds.",
    },
    {
      q: "What are the fees?",
      a: "Lock Pay charges a small per-transfer service fee that's shown clearly before you confirm any transfer. There are no monthly fees and no hidden charges. Standard payment-processor fees may also apply.",
    },
    {
      q: "How do I get help?",
      a: "Reach our team any time at support@getlockpayapp.com or through the Contact page. We typically respond within one business day.",
    },
  ];
  return (
    <section id="faq" className="mt-24">
      <SectionHeader eyebrow="Questions" title="Everything you need to know." />
      <div className="mt-8 mx-auto max-w-2xl divide-y divide-border/70 rounded-2xl border border-border/70 bg-card shadow-card">
        {items.map((it, i) => (
          <FaqRow key={i} q={it.q} a={it.a} />
        ))}
      </div>
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Mail className="h-4 w-4" />
        Still have questions?{" "}
        <Link to="/contact" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Contact support
        </Link>
      </div>
    </section>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="block w-full px-5 py-4 text-left transition hover:bg-secondary/30"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>}
    </button>
  );
}

/* ------------------------- Final CTA ------------------------- */

function FinalCta() {
  return (
    <section className="mt-24">
      <div className="relative overflow-hidden rounded-3xl bg-primary p-8 sm:p-12 text-primary-foreground shadow-elevated">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-primary-glow/40 blur-3xl" />
        <div className="relative max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold">
            <Sparkles className="h-3 w-3" /> Ready when you are
          </div>
          <h3 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            Send your first verified transfer in under a minute.
          </h3>
          <p className="mt-3 text-sm sm:text-base text-primary-foreground/80">
            Verify your identity, add a recipient, and send with confidence.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/get-started">
                Send Money Securely <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-2xl border-white/20 bg-white/5 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
              <Link to="/contact">
                <LifeBuoy className="mr-1 h-4 w-4" /> Contact support
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Mobile sticky CTA ------------------------- */

function StickyMobileCta() {
  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-xl">
      <Button
        asChild
        className="h-12 w-full rounded-2xl text-sm font-semibold gradient-primary text-primary-foreground shadow-elevated"
      >
        <Link to="/get-started">
          <ShieldCheck className="mr-1.5 h-4 w-4" />
          Send Money Securely
        </Link>
      </Button>
    </div>
  );
}

/* ------------------------- Shared ------------------------- */

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-balance text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
        {title}
      </h2>
    </div>
  );
}
