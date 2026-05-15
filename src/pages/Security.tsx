import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  ShieldAlert,
  KeyRound,
  Clock,
  Smartphone,
  ChevronLeft,
  Fingerprint,
} from "lucide-react";

const PILLARS = [
  {
    icon: Fingerprint,
    title: "Identity Verification",
    desc: "Recipients must confirm a unique code before funds move. Every transfer is matched to a verified identity.",
  },
  {
    icon: Lock,
    title: "Encrypted Communication",
    desc: "Codes and data are transmitted over encrypted channels. Sensitive details are protected end to end.",
  },
  {
    icon: ShieldAlert,
    title: "Fraud Prevention",
    desc: "Suspicious activity triggers automatic review. Patterns indicating fraud halt the transfer flow.",
  },
  {
    icon: ShieldCheck,
    title: "Transfer Verification",
    desc: "Every transfer has a unique checkpoint before completion. No transfer completes without confirmation.",
  },
  {
    icon: Clock,
    title: "Automatic Code Expiry",
    desc: "Unused codes expire and cancel the transfer immediately. Time-bound verification protects you by default.",
  },
  {
    icon: Smartphone,
    title: "Device & Session Protection",
    desc: "New devices require re-verification, and sessions time out. Account access stays tightly scoped to you.",
  },
];

export default function Security() {
  return (
    <div className="min-h-screen bg-background pb-safe">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link to="/welcome" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <span className="text-sm font-semibold">Security</span>
          <span className="w-12" />
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 gradient-hero" />
        <div className="relative mx-auto max-w-3xl px-5 pb-12 pt-16 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary"
          >
            <ShieldCheck className="h-7 w-7" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-balance text-4xl font-bold leading-[1.1] tracking-[-0.02em] md:text-5xl"
          >
            Built around your security.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground"
          >
            Every transfer on LockPay requires identity confirmation from the recipient.
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="grid gap-4 sm:grid-cols-2"
        >
          {PILLARS.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
              className="rounded-3xl border border-white/[0.08] bg-card p-6 transition-all hover:border-primary/30 hover:card-glow"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <p className="mx-auto mt-16 max-w-xl text-center text-xs leading-relaxed text-muted-foreground/70">
          LockPay provides transfer verification and confirmation technology and is not a bank or custodial financial institution.
        </p>
      </section>
    </div>
  );
}
