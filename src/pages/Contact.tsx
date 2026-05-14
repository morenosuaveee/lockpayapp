import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Mail, Globe, Send, CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";
import { AppShell } from "@/components/layout/AppShell";
import { LegalFooter, SUPPORT_EMAIL } from "@/components/layout/LegalFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  subject: z.string().trim().min(1, "Please add a subject").max(150),
  message: z.string().trim().min(1, "Please write a message").max(2000),
});

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-message",
          templateData: result.data,
        },
      });
      if (error) throw error;
      if (data && (data as any).error) throw new Error((data as any).error);
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact form send failed", err);
      toast.error("We couldn't send your message. Please email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="px-6 pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <h1 className="mt-4 text-2xl font-bold tracking-tight">Contact us</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Questions about your account, a payment, or our platform? Reach out.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-2.5">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition active:scale-[0.99] hover:bg-secondary/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Support Email</p>
              <p className="truncate text-xs text-muted-foreground">{SUPPORT_EMAIL}</p>
            </div>
          </a>
          <a
            href="https://getlockpay.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition active:scale-[0.99] hover:bg-secondary/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <Globe className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Website</p>
              <p className="truncate text-xs text-muted-foreground">getlockpay.com</p>
            </div>
          </a>
        </div>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-center shadow-card">
            <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
            <p className="mt-3 text-sm font-semibold">Message sent</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Thanks for reaching out. Our support team typically responds within 24–48 business hours
              to <span className="font-medium text-foreground">{SUPPORT_EMAIL}</span>.
            </p>
            <Button
              variant="outline"
              onClick={() => setSent(false)}
              className="mt-4 h-10 rounded-xl text-sm"
            >
              Send another message
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" autoComplete="name" value={form.name} onChange={update("name")} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" autoComplete="email" value={form.email} onChange={update("email")} placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={form.subject} onChange={update("subject")} placeholder="How can we help?" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" rows={5} value={form.message} onChange={update("message")} placeholder="Tell us a little about what you need…" />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-2xl text-sm font-semibold gradient-primary text-primary-foreground shadow-elevated active:scale-[0.98]"
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Send message</>
              )}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Our support team typically responds within 24–48 business hours.
            </p>
          </form>
        )}
      </div>
      <LegalFooter />
    </AppShell>
  );
}
