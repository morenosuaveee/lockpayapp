import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronDown, Search, Mail, Send, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FAQS = [
  {
    q: "How does recipient verification work?",
    a: "When you initiate a transfer, LockPay sends a unique verification code to your recipient. They must enter that code to confirm their identity before the transfer completes. If they don't verify in time, the transfer is automatically canceled.",
  },
  {
    q: "What happens if the recipient doesn't verify in time?",
    a: "The transfer is automatically canceled for your protection. No funds are moved. You'll receive a notification and can choose to try again.",
  },
  {
    q: "How long does the recipient have to verify?",
    a: "Verification codes are active for 10 minutes. After that, they expire and the transfer is canceled.",
  },
  {
    q: "Can I cancel a transfer after sending a verification code?",
    a: "Yes. While in \u201CAwaiting Confirmation\u201D status, you can cancel from the transfer detail screen.",
  },
  {
    q: "Is LockPay a bank?",
    a: "No. LockPay is a transfer verification platform, not a bank or financial institution.",
  },
  {
    q: "How do I contact support?",
    a: "Email support@getlockpayapp.com. We respond within one business day.",
  },
];

const SUBJECTS = [
  "General question",
  "Verification issue",
  "Transfer problem",
  "Account & security",
  "Billing",
  "Other",
];

export default function Support() {
  const [open, setOpen] = useState<number | null>(0);
  const [query, setQuery] = useState("");
  const filtered = FAQS.filter(
    (f) => f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-safe">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link to="/welcome" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <span className="text-sm font-semibold">Support</span>
          <span className="w-12" />
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 pb-12 pt-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-balance text-4xl font-bold tracking-[-0.02em] md:text-5xl"
        >
          How can we help?
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="relative mx-auto mt-7 max-w-md"
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles"
            className="h-[54px] w-full rounded-2xl border border-white/[0.1] bg-[#1A1A1A] pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </motion.div>
      </section>

      <section className="mx-auto max-w-3xl px-5">
        <h2 className="eyebrow">Frequently asked</h2>
        <div className="space-y-2">
          {filtered.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-card">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left active:scale-[0.995] transition-transform"
                >
                  <span className="text-[15px] font-medium">{f.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="rounded-2xl border border-white/[0.08] bg-card px-5 py-8 text-center text-sm text-muted-foreground">
              No results. Email <a href="mailto:support@getlockpayapp.com" className="text-primary">support@getlockpayapp.com</a>.
            </p>
          )}
        </div>
      </section>

      <ContactSection />
    </div>
  );
}

function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill out all fields.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          template: "contact-message",
          to: "support@getlockpayapp.com",
          data: { name, email, subject, message },
        },
      });
      if (error) throw error;
      setSent(true);
      setName(""); setEmail(""); setMessage("");
    } catch {
      toast.error("Could not send. Email support@getlockpayapp.com directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-16 max-w-3xl px-5 pb-20">
      <h2 className="eyebrow">Contact us</h2>
      <div className="rounded-3xl border border-white/[0.08] bg-card p-6 md:p-8">
        {sent ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-success animate-success-pop" />
            <h3 className="mt-4 text-xl font-semibold">Message sent.</h3>
            <p className="mt-2 text-sm text-muted-foreground">We respond within 1 business day.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base"
                placeholder="Your name"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Subject">
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input-base appearance-none pr-10"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s} className="bg-[#1A1A1A]">{s}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </Field>
            <Field label="Message">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="input-base h-auto py-4 leading-relaxed"
                placeholder="How can we help?"
              />
            </Field>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-white transition-all hover:bg-[#4F8FF0] active:scale-[0.97] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Message
            </button>
            <p className="pt-1 text-center text-xs text-muted-foreground">We respond within 1 business day.</p>
          </form>
        )}
      </div>

      <p className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Mail className="h-4 w-4" />
        <a href="mailto:support@getlockpayapp.com" className="text-foreground">support@getlockpayapp.com</a>
      </p>

      <style>{`
        .input-base {
          width: 100%;
          background: #1A1A1A;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          height: 54px;
          padding: 0 18px;
          font-size: 16px;
          color: hsl(var(--foreground));
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input-base:focus {
          border-color: hsl(var(--primary) / 0.5);
          box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15);
        }
        .input-base::placeholder { color: hsl(var(--muted-foreground) / 0.7); }
      `}</style>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
