import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  XCircle,
  KeyRound,
  Clock,
  ShieldAlert,
  Lock,
  UserCheck,
  Send,
} from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const STEPS = [
  { n: 1, title: "Enter recipient information", desc: "Add the person you want to send to.", tone: "default" as const },
  { n: 2, title: "A verification code is sent", desc: "We send a unique code to the recipient.", tone: "default" as const },
  { n: 3, title: "Recipient confirms identity", desc: "They enter the code to prove it's them.", tone: "default" as const },
  { n: 4, title: "Transfer is authorized & completes", desc: "Funds move only after confirmation.", tone: "success" as const },
  { n: 5, title: "Verification fails or expires", desc: "Transfer is automatically canceled.", tone: "error" as const },
];

const FEATURES = [
  {
    icon: UserCheck,
    title: "Identity-Confirmed Transfers",
    desc: "Every transfer requires recipient verification before funds move.",
  },
  {
    icon: Clock,
    title: "Verification Expires Automatically",
    desc: "Codes expire if unused, protecting you from hijacked transfers.",
  },
  {
    icon: ShieldCheck,
    title: "Protected Transfer Flow",
    desc: "If verification fails at any point, the transfer is canceled for your protection.",
  },
];

export default function Welcome() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <HowItWorks />
      <WhyLockPay />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-white/[0.06]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/welcome" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
            <Lock className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight">LockPay</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link to="/security" className="hover:text-foreground transition-colors">Security</Link>
          <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
          <Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link>
        </nav>
        <Link
          to="/signup"
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-white/90 transition-colors"
        >
          Get started
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 gradient-hero" />
      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 md:pt-24">
        <motion.div initial="hidden" animate="show" variants={stagger} className="mx-auto max-w-3xl text-center">
          <motion.div
            variants={fadeUp}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
            Recipient-verified transfers
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] md:text-6xl"
          >
            Never Send Money to the Wrong Person Again.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            LockPay adds recipient verification and secure confirmation codes before transfers are completed.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-base font-semibold text-white transition-all hover:bg-[#4F8FF0] active:scale-[0.97] sm:w-auto"
            >
              <Send className="h-4 w-4" />
              Send Securely
            </Link>
            <a
              href="#how"
              className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-transparent px-7 text-base font-semibold text-foreground transition-colors hover:bg-white/[0.04] active:scale-[0.97] sm:w-auto"
            >
              How It Works
            </a>
          </motion.div>
        </motion.div>

        <PhoneMock />
      </div>
    </section>
  );
}

function PhoneMock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
      className="relative mx-auto mt-16 w-full max-w-[340px]"
    >
      <div className="absolute -inset-12 -z-10 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative rounded-[44px] border border-white/10 bg-[#0F0F0F] p-3 shadow-elevated">
        <div className="overflow-hidden rounded-[34px] bg-[#0A0A0A]">
          <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-medium text-muted-foreground">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-foreground/60" />
              <span className="h-1 w-1 rounded-full bg-foreground/60" />
              <span className="h-1 w-1 rounded-full bg-foreground/60" />
            </span>
          </div>
          <div className="px-5 pb-6 pt-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Verification sent
            </div>
            <div className="mt-1 text-[22px] font-semibold leading-tight">
              Awaiting Sarah's confirmation
            </div>
            <div className="mt-5 rounded-2xl glass p-5">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Code</div>
              <div className="mt-2 text-center text-[48px] font-bold tracking-[0.08em] text-foreground tabular-nums">
                4821
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Code expires in 10:00
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-card p-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">To</div>
                <div className="text-sm font-semibold">Sarah K.</div>
              </div>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-medium text-primary">
                Pending Verification
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold tabular-nums">$240.00</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="border-t border-white/[0.06] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="text-3xl font-semibold tracking-[-0.01em] md:text-[40px]">
            Verification, end to end.
          </h2>
        </div>

        <motion.ol
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="relative mx-auto mt-12 max-w-2xl space-y-3"
        >
          {STEPS.map((s) => {
            const tone =
              s.tone === "success"
                ? "border-success/40 bg-success/[0.06]"
                : s.tone === "error"
                ? "border-destructive/40 bg-destructive/[0.06]"
                : "border-white/[0.08] bg-card";
            const numTone =
              s.tone === "success"
                ? "bg-success text-black"
                : s.tone === "error"
                ? "bg-destructive text-white"
                : "bg-white/[0.06] text-foreground";
            const Icon = s.tone === "success" ? CheckCircle2 : s.tone === "error" ? XCircle : null;
            return (
              <motion.li
                key={s.n}
                variants={fadeUp}
                className={`flex items-start gap-4 rounded-2xl border p-5 ${tone}`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${numTone}`}>
                  {Icon ? <Icon className="h-4 w-4" /> : s.n}
                </div>
                <div className="flex-1 pt-1">
                  <div className={`text-[15px] font-semibold ${s.tone === "error" ? "text-destructive" : ""}`}>
                    {s.title}
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.desc}</div>
                </div>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </section>
  );
}

function WhyLockPay() {
  return (
    <section className="border-t border-white/[0.06] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Why LockPay</p>
          <h2 className="text-3xl font-semibold tracking-[-0.01em] md:text-[40px]">
            Built for transfers that can't go wrong.
          </h2>
        </div>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mt-12 grid gap-4 md:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              className="group rounded-3xl border border-white/[0.08] bg-card p-6 transition-all hover:border-primary/30 hover:card-glow"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="border-t border-white/[0.06] py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <ShieldAlert className="mx-auto mb-5 h-10 w-10 text-primary" />
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.01em] md:text-[44px]">
            Send with confidence. Every time.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            Add recipient verification to every transfer. Set up takes less than a minute.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-base font-semibold text-white transition-all hover:bg-[#4F8FF0] active:scale-[0.97]"
          >
            Send Securely
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Link to="/welcome" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
                <Lock className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-semibold tracking-tight">LockPay</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">support@getlockpayapp.com</p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Product</div>
              <ul className="space-y-2">
                <li><Link to="/security" className="text-muted-foreground hover:text-foreground">Security</Link></li>
                <li><Link to="/support" className="text-muted-foreground hover:text-foreground">Support</Link></li>
              </ul>
            </div>
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Legal</div>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link></li>
                <li><Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Account</div>
              <ul className="space-y-2">
                <li><Link to="/login" className="text-muted-foreground hover:text-foreground">Sign in</Link></li>
                <li><Link to="/signup" className="text-muted-foreground hover:text-foreground">Get started</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 max-w-2xl text-xs leading-relaxed text-muted-foreground/70">
          LockPay provides transfer verification and confirmation technology and is not a bank or custodial financial institution.
        </p>
        <p className="mt-3 text-xs text-muted-foreground/50">© {new Date().getFullYear()} LockPay. All rights reserved.</p>
      </div>
    </footer>
  );
}
