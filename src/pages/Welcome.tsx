import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Lock,
  ShieldCheck,
  BadgeCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  UserCheck,
  Send,
  Zap,
  Fingerprint,
  EyeOff,
  
  ChevronDown,
  LifeBuoy,
  Mail,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LegalFooter } from "@/components/layout/LegalFooter";
import { calcFeeDollars } from "@/lib/fees";

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
            <Lock className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.4} />
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
            <Link to="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------- Hero ------------------------- */

function Hero() {
  return (
    <section className="grid gap-10 pt-10 sm:pt-16 md:grid-cols-2 md:gap-12 md:pt-20">
      <div className="animate-slide-up">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-[11px] font-semibold text-accent-foreground">
          <ShieldCheck className="h-3 w-3" /> Identity-confirmed transfer coordination
        </div>
        <h1 className="mt-5 text-balance text-[40px] sm:text-[52px] font-bold leading-[1.02] tracking-tight">
          Verify before you{" "}
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            send
          </span>
          .
        </h1>
        <p className="mt-4 text-balance text-[16px] sm:text-[17px] leading-relaxed text-muted-foreground max-w-lg">
          Lock Pay is a secure transfer coordination app. We verify the recipient's identity
          before a transfer is initiated — designed to help reduce mistaken transfers.
        </p>

        <div className="mt-6 hidden md:flex items-center gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-2xl px-6 text-sm font-semibold gradient-primary text-primary-foreground shadow-elevated hover:opacity-95"
          >
            <a href="#simulator">
              Send money <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-2xl px-6 text-sm font-semibold">
            <Link to="/signup">Create account</Link>
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
          <Stat label="Recipient match" value="100%" />
          <Stat label="Encryption" value="256-bit" />
          <Stat label="Avg release" value="Instant" />
        </div>
      </div>

      <div id="simulator" className="animate-slide-up">
        <TransferSimulator />
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

/* ----------------- Interactive transfer simulator ----------------- */

// Smoothly tweens a numeric value for premium "live" feel.
function useAnimatedNumber(value: number, duration = 450) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    fromRef.current = display;
    startRef.current = null;
    const target = value;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(fromRef.current + (target - fromRef.current) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return display;
}

type RecipientStatus = "idle" | "checking" | "verified" | "unverified";

// Mock verified-recipient directory for the pre-auth demo.
const VERIFIED_DEMO: Record<string, { name: string; mask: string }> = {
  "@johndoe": { name: "John D.", mask: "Ends in 4421" },
  "@sarah": { name: "Sarah M.", mask: "Ends in 8830" },
  "@alex": { name: "Alex P.", mask: "Ends in 2117" },
};

function lookupRecipient(input: string): { name: string; mask: string } | null {
  const key = input.trim().toLowerCase();
  if (!key) return null;
  if (VERIFIED_DEMO[key]) return VERIFIED_DEMO[key];
  // Treat any reasonable email/phone/username as verified for the demo.
  const looksValid =
    /^@[a-z0-9._-]{3,}$/i.test(key) ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key) ||
    /^\+?\d[\d\s().-]{6,}$/.test(key);
  if (!looksValid) return null;
  // Derive a friendly display from the input.
  const base = key.replace(/^@/, "").split(/[@\s.]/)[0] || "Recipient";
  const name = base.charAt(0).toUpperCase() + base.slice(1, 8);
  const mask = `Ends in ${(Math.abs(hashCode(key)) % 9000 + 1000)}`;
  return { name: `${name}.`, mask };
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

function TransferSimulator() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<string>("100");
  const [recipient, setRecipient] = useState<string>("@johndoe");
  const [type, setType] = useState<string>("standard");
  const [status, setStatus] = useState<RecipientStatus>("idle");
  const [match, setMatch] = useState<{ name: string; mask: string } | null>(null);
  const [sending, setSending] = useState(false);

  const amountNum = useMemo(() => {
    const n = Number(amount);
    return isFinite(n) && n > 0 ? n : 0;
  }, [amount]);

  const fee = useMemo(() => calcFeeDollars(amountNum), [amountNum]);
  const total = amountNum + fee;
  const animTotal = useAnimatedNumber(total);
  const animFee = useAnimatedNumber(fee);

  // Debounced recipient verification simulation.
  useEffect(() => {
    if (recipient.trim().length < 3) {
      setStatus("idle");
      setMatch(null);
      return;
    }
    setStatus("checking");
    setMatch(null);
    const t = setTimeout(() => {
      const found = lookupRecipient(recipient);
      if (found) {
        setStatus("verified");
        setMatch(found);
      } else {
        setStatus("unverified");
      }
    }, 550);
    return () => clearTimeout(t);
  }, [recipient]);

  const canSend = status === "verified" && amountNum > 0 && !sending;

  const handleSendSecurely = () => {
    if (!canSend) return;
    setSending(true);
    try {
      sessionStorage.setItem(
        "lockpay.simulatedTransfer",
        JSON.stringify({
          amount: amountNum,
          recipient,
          type,
          recipientName: match?.name,
          recipientMask: match?.mask,
          ts: Date.now(),
        }),
      );
    } catch {
      // ignore
    }
    // Brief "preparing secure session" beat for premium feel.
    setTimeout(() => navigate("/signup", { state: { fromSimulator: true } }), 650);
  };

  return (
    <div className="relative">
      <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-accent/20 via-primary/10 to-transparent blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/95 p-5 sm:p-6 shadow-elevated backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Try the transfer flow
            </div>
            <div className="mt-0.5 text-base font-semibold">Verify before you sign up</div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-bold text-accent-foreground">
            <BadgeCheck className="h-3 w-3" /> Encrypted demo
          </span>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="amt" className="text-xs text-muted-foreground">You send</Label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted-foreground">
                $
              </span>
              <Input
                id="amt"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                className="h-16 pl-9 pr-16 text-2xl font-bold tabular-nums transition-shadow"
                placeholder="0.00"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                USD
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="rcpt" className="text-xs text-muted-foreground">
              Recipient · username, email, or phone
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="rcpt"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className={`pr-10 transition-shadow ${
                  status === "verified" ? "border-accent/60 ring-2 ring-accent/15" : ""
                } ${status === "unverified" ? "border-destructive/60" : ""}`}
                placeholder="@username or name@email.com"
                autoComplete="off"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                {status === "checking" && (
                  <span className="block h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-accent" />
                )}
                {status === "verified" && <CheckCircle2 className="h-5 w-5 text-accent" />}
                {status === "unverified" && <X className="h-5 w-5 text-destructive" />}
              </div>
            </div>

            {/* Recipient state card */}
            <div
              className={`mt-2 overflow-hidden rounded-xl border text-xs transition-all duration-300 ${
                status === "verified"
                  ? "border-accent/40 bg-accent-soft/70 px-3 py-2 opacity-100"
                  : status === "unverified"
                  ? "border-destructive/30 bg-destructive-soft px-3 py-2 opacity-100"
                  : "max-h-0 border-transparent px-3 py-0 opacity-0"
              }`}
            >
              {status === "verified" && match && (
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-foreground">Verified Recipient</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-foreground/80">{match.name}</span>
                  <span className="text-muted-foreground">· {match.mask}</span>
                </div>
              )}
              {status === "unverified" && (
                <div className="flex items-center gap-2 text-destructive">
                  <X className="h-4 w-4" />
                  <span className="font-semibold">Recipient not verified</span>
                  <span className="text-destructive/80">· transfer cannot release</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Transfer type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1.5 h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard · identity-confirmed</SelectItem>
                <SelectItem value="instant">Instant · verified recipient</SelectItem>
                <SelectItem value="agreement">Agreement · dual confirmation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 space-y-2 rounded-2xl bg-secondary/50 p-3.5">
          <Row
            icon={<UserCheck className="h-4 w-4 text-accent" />}
            label="Recipient status"
            value={
              status === "verified"
                ? "Verified ✓"
                : status === "checking"
                ? "Verifying…"
                : status === "unverified"
                ? "Not verified"
                : "Awaiting input"
            }
          />
          <Row
            icon={<Lock className="h-4 w-4 text-accent" />}
            label="Transfer status"
            value="Awaits recipient confirmation"
          />
          <Row
            icon={<Zap className="h-4 w-4 text-accent" />}
            label="Delivery time"
            value="Instant after confirmation"
          />
          <Row
            icon={<Sparkles className="h-4 w-4 text-accent" />}
            label="Transfer fee"
            value={`$${animFee.toFixed(2)}`}
          />
          <div className="my-1 h-px bg-border/70" />
          <Row label="Total" value={`$${animTotal.toFixed(2)}`} bold />
        </div>

        <Button
          onClick={handleSendSecurely}
          disabled={!canSend}
          className="mt-4 h-14 w-full rounded-2xl text-base font-semibold gradient-primary text-primary-foreground shadow-elevated transition-all hover:opacity-95 hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {sending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Preparing secure session…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" /> Send Securely
            </>
          )}
        </Button>
        <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          Create an account to complete this transfer.
        </p>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  bold,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className={bold ? "font-semibold text-foreground" : ""}>{label}</span>
      </span>
      <span className={`tabular-nums ${bold ? "font-bold text-foreground" : "font-medium text-foreground/90"}`}>
        {value}
      </span>
    </div>
  );
}

/* ------------------------- How it works ------------------------- */

function HowItWorks() {
  const steps = [
    { n: 1, title: "Enter recipient details", desc: "Send to a username, email, or phone — we'll match it to a verified Lock Pay account.", icon: <Send className="h-5 w-5" /> },
    { n: 2, title: "Recipient is verified", desc: "Lock Pay confirms the receiving party's identity before a transfer is initiated.", icon: <UserCheck className="h-5 w-5" /> },
    { n: 3, title: "Recipient confirms", desc: "The recipient acknowledges and confirms the transfer in-app.", icon: <Lock className="h-5 w-5" /> },
    { n: 4, title: "Transfer completes", desc: "Both parties get an instant in-app receipt with full transfer history.", icon: <CheckCircle2 className="h-5 w-5" /> },
  ];
  return (
    <section id="how" className="mt-24">
      <SectionHeader eyebrow="How it works" title="Four steps to a verified transfer." />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n} className="relative rounded-2xl border border-border/70 bg-card p-5 shadow-card transition hover:shadow-elevated">
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
              <Link to="/signup">Open a secure account</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-2xl">
              <Link to="/contact">Talk to support</Link>
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
      a: "When you initiate a transfer, Lock Pay first matches the recipient to a verified Lock Pay account and asks them to confirm in-app. Payment movement itself is handled by our independent third-party payment processor. The verification step is designed to help reduce mistaken transfers by ensuring you're sending to the person you actually intend to.",
    },
    {
      q: "What happens if I send to the wrong username, email, or phone?",
      a: "If the destination doesn't match a verified Lock Pay account, the transfer is not initiated and the request is cancelled. If a recipient match is found but they don't confirm within 48 hours, the request is cancelled and any pending charge by the payment processor is reversed to your original payment method according to the processor's standard timelines.",
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
      a: "Traffic is encrypted in transit with TLS 1.2+, sensitive data is encrypted at rest, and authentication uses industry-standard providers with phone-based verification. Card details are tokenized by our PCI-compliant payment processor — Lock Pay never stores raw card numbers. You can review or delete your account at any time from Profile.",
    },
    {
      q: "Is Lock Pay a bank or escrow service?",
      a: "No. Lock Pay is a technology platform that coordinates peer-to-peer transfers and verifies recipients. Lock Pay is not a bank, money transmitter, escrow agent, or insured financial institution and does not hold customer funds. Payment movement is performed by independent third-party processors.",
    },
    {
      q: "What are the fees?",
      a: "Lock Pay charges a small per-transfer service fee that's shown clearly before you confirm any transfer. There are no monthly fees, no membership tiers, and no hidden charges. Standard payment-processor fees may also apply depending on your funding source.",
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
            Verify your phone, add a recipient, and send with confidence.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/signup">
                Create account <ArrowRight className="ml-1 h-4 w-4" />
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
        <a href="#simulator">
          Send money <ArrowRight className="ml-1 h-4 w-4" />
        </a>
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
