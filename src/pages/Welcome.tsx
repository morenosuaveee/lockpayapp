import { useMemo, useState } from "react";
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
  Star,
  ChevronDown,
  LifeBuoy,
  Mail,
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
          <ShieldCheck className="h-3 w-3" /> Verified-recipient transfer protection
        </div>
        <h1 className="mt-5 text-balance text-[40px] sm:text-[52px] font-bold leading-[1.02] tracking-tight">
          Never send money to the{" "}
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            wrong person
          </span>{" "}
          again.
        </h1>
        <p className="mt-4 text-balance text-[16px] sm:text-[17px] leading-relaxed text-muted-foreground max-w-lg">
          Lock Pay protects every transfer by verifying the recipient before
          funds are released — so your money reaches exactly who it's meant for.
        </p>

        <div className="mt-6 hidden md:flex items-center gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-2xl px-6 text-sm font-semibold gradient-primary text-primary-foreground shadow-elevated hover:opacity-95"
          >
            <a href="#simulator">
              Try a demo transfer <ArrowRight className="ml-1 h-4 w-4" />
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

function TransferSimulator() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<string>("100");
  const [recipient, setRecipient] = useState<string>("@johndoe");
  const [type, setType] = useState<string>("standard");

  const amountNum = useMemo(() => {
    const n = Number(amount);
    return isFinite(n) && n > 0 ? n : 0;
  }, [amount]);

  const fee = useMemo(() => calcFeeDollars(amountNum), [amountNum]);
  const total = amountNum + fee;
  const recipientValid = recipient.trim().length >= 3;

  const handleSendSecurely = () => {
    try {
      sessionStorage.setItem(
        "lockpay.simulatedTransfer",
        JSON.stringify({ amount: amountNum, recipient, type, ts: Date.now() }),
      );
    } catch {
      // ignore
    }
    navigate("/signup", { state: { fromSimulator: true } });
  };

  return (
    <div className="relative">
      <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-accent/20 via-primary/10 to-transparent blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/95 p-5 sm:p-6 shadow-elevated backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Try a protected transfer
            </div>
            <div className="mt-0.5 text-base font-semibold">Simulate before you sign up</div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-bold text-accent-foreground">
            <BadgeCheck className="h-3 w-3" /> Demo
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
                className="h-16 pl-9 text-2xl font-bold tabular-nums"
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
            <Input
              id="rcpt"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="mt-1.5"
              placeholder="@username or name@email.com"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Transfer type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1.5 h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard · protected release</SelectItem>
                <SelectItem value="instant">Instant · verified recipient</SelectItem>
                <SelectItem value="agreement">Agreement · dual confirmation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 space-y-2 rounded-2xl bg-secondary/50 p-3.5">
          <Row icon={<UserCheck className="h-4 w-4 text-accent" />} label="Verified recipient match" value="Required" />
          <Row icon={<Lock className="h-4 w-4 text-accent" />} label="Funds protected until accepted" value="Yes" />
          <Row icon={<Zap className="h-4 w-4 text-accent" />} label="Delivery time" value="Instant after verification" />
          <Row icon={<Sparkles className="h-4 w-4 text-accent" />} label="Transfer fee" value={`$${fee.toFixed(2)}`} />
          <div className="my-1 h-px bg-border/70" />
          <Row label="Total" value={`$${total.toFixed(2)}`} bold />
        </div>

        <Button
          onClick={handleSendSecurely}
          disabled={!recipientValid || amountNum <= 0}
          className="mt-4 h-14 w-full rounded-2xl text-base font-semibold gradient-primary text-primary-foreground shadow-elevated hover:opacity-95 active:scale-[0.99]"
        >
          <Send className="h-4 w-4" /> Send Securely
        </Button>
        <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
          Create an account to securely complete your protected transfer.
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
    { n: 1, title: "Enter recipient details", desc: "Send to a username, email, or phone — we'll match it to a verified recipient.", icon: <Send className="h-5 w-5" /> },
    { n: 2, title: "Recipient gets verified", desc: "Lock Pay confirms the receiving party before any funds move.", icon: <UserCheck className="h-5 w-5" /> },
    { n: 3, title: "Funds securely released", desc: "Your transfer is protected until the verified recipient accepts.", icon: <Lock className="h-5 w-5" /> },
    { n: 4, title: "Transfer confirmed instantly", desc: "Both parties get instant confirmation with a permanent receipt.", icon: <CheckCircle2 className="h-5 w-5" /> },
  ];
  return (
    <section id="how" className="mt-24">
      <SectionHeader eyebrow="How it works" title="Four steps to a protected transfer." />
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
    { icon: <ShieldCheck className="h-5 w-5" />, title: "Recipient verification", desc: "Every payee is verified before funds release." },
    { icon: <Lock className="h-5 w-5" />, title: "256-bit encryption", desc: "Bank-grade encryption on every transfer in transit and at rest." },
    { icon: <Fingerprint className="h-5 w-5" />, title: "Secure authentication", desc: "Biometric and OTP-secured logins keep your account yours." },
    { icon: <EyeOff className="h-5 w-5" />, title: "Fraud prevention", desc: "Behavioral signals flag suspicious transfers in real time." },
  ];
  return (
    <section id="security" className="mt-24">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <SectionHeader eyebrow="Security" title="Built so funds only reach the right hands." />
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground max-w-md">
            Funds remain protected until accepted by the verified recipient.
            Lock Pay combines recipient verification, encryption, and fraud
            controls into a single, simple flow.
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
  const reviews = [
    { name: "Maya R.", text: "I sent to the wrong handle once and panicked. Lock Pay caught it before release. Game-changer.", rating: 5 },
    { name: "Devon K.", text: "Love that the recipient has to verify. Feels safer than every other transfer app I've used.", rating: 5 },
    { name: "Priya S.", text: "Clean, fast, and the protection layer just makes sense. Use it for every payment now.", rating: 5 },
  ];
  return (
    <section className="mt-24">
      <SectionHeader eyebrow="Trusted by senders" title="Confidence, on every transfer." />
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {reviews.map((r) => (
          <div key={r.name} className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
            <div className="flex gap-0.5">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-accent text-accent" />
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">"{r.text}"</p>
            <p className="mt-3 text-xs font-semibold text-muted-foreground">{r.name}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Encrypted transfers</span>
        <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5" /> Verified recipients</span>
        <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Protected release</span>
        <span className="inline-flex items-center gap-1.5"><Fingerprint className="h-3.5 w-3.5" /> Secure auth</span>
      </div>
    </section>
  );
}

/* ------------------------- FAQ ------------------------- */

function Faq() {
  const items = [
    { q: "How does Lock Pay protect transfers?", a: "Funds are held under a protection layer until the recipient is verified and confirms the transfer. If something looks wrong, the transfer never releases." },
    { q: "What happens if I send to the wrong person?", a: "Because recipients must be verified before funds release, mistyped or unverified destinations don't complete — your money stays protected." },
    { q: "How fast are transfers?", a: "Most transfers release instantly after the recipient is verified. Standard transfers may take a few minutes during peak times." },
    { q: "Are recipients verified?", a: "Yes. Every recipient is matched against verified account data before any funds are released." },
    { q: "Is Lock Pay secure?", a: "We use 256-bit encryption, secure authentication, and continuous fraud monitoring on every transfer." },
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
            Send your first protected transfer in under a minute.
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
          Try a demo transfer <ArrowRight className="ml-1 h-4 w-4" />
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
