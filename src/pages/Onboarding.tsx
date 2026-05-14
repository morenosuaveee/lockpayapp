import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Phone as PhoneIcon,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +14155551234");

type Step = "welcome" | "name" | "phone" | "code" | "how" | "done";

const STEPS: Step[] = ["welcome", "name", "phone", "code", "how", "done"];

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("welcome");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Bootstrap: if already onboarded, skip
  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone_verified_at")
        .eq("id", user.id)
        .maybeSingle();
      if (cancel) return;
      const done =
        localStorage.getItem(`lp_onboarded_${user.id}`) === "1" ||
        !!data?.phone_verified_at;
      if (done) {
        navigate("/", { replace: true });
        return;
      }
      if (data?.display_name) setDisplayName(data.display_name);
      setBootstrapped(true);
    })();
    return () => {
      cancel = true;
    };
  }, [user, navigate]);

  const stepIndex = useMemo(() => STEPS.indexOf(step), [step]);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  if (!authLoading && !user) return <Navigate to="/signup" replace />;

  async function saveName() {
    if (!user) return;
    if (displayName.trim().length < 2) {
      toast.error("Enter your name");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStep("phone");
  }

  async function sendCode() {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("phone-verify-start", {
      body: { phone: parsed.data },
    });
    setSending(false);
    const err = (data as { error?: string } | null)?.error;
    if (error || err) {
      toast.error(err ?? error?.message ?? "Could not send code");
      return;
    }
    toast.success("Code sent");
    setCode("");
    setStep("code");
  }

  async function verify() {
    if (code.length < 4) {
      toast.error("Enter the code");
      return;
    }
    setVerifying(true);
    const { data, error } = await supabase.functions.invoke("phone-verify-check", {
      body: { phone: phone.trim(), code },
    });
    setVerifying(false);
    const payload = data as { verified?: boolean; error?: string } | null;
    if (error || !payload?.verified) {
      toast.error(payload?.error ?? error?.message ?? "Incorrect code");
      return;
    }
    toast.success("Phone verified");
    setStep("how");
  }

  function finish() {
    if (user) localStorage.setItem(`lp_onboarded_${user.id}`, "1");
    navigate("/send", { replace: true });
  }

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-background to-secondary/60 pt-safe">
      <div className="pointer-events-none absolute -top-32 -right-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      {/* Progress */}
      <div className="relative px-5 pt-4">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          Step {stepIndex + 1} of {STEPS.length}
        </p>
      </div>

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-6">
        {step === "welcome" && (
          <StepShell
            icon={<Lock className="h-7 w-7 text-primary-foreground" strokeWidth={2.4} />}
            title="Welcome to LockPay"
            subtitle="Send money with confidence. Funds release only when both sides confirm."
          >
            <FeatureRow icon={<ShieldCheck className="h-5 w-5 text-accent" />} title="Verified recipients" desc="We verify before any release." />
            <FeatureRow icon={<Lock className="h-5 w-5 text-accent" />} title="Shared release code" desc="A 4-digit code only you two share." />
            <FeatureRow icon={<Sparkles className="h-5 w-5 text-accent" />} title="Auto-refunded in 48h" desc="If unconfirmed, funds return to you." />
            <PrimaryCTA onClick={() => setStep("name")} label="Get started" />
          </StepShell>
        )}

        {step === "name" && (
          <StepShell
            icon={<UserCircle2 className="h-7 w-7 text-primary-foreground" />}
            title="What's your name?"
            subtitle="This is how recipients will see you."
          >
            <div className="space-y-1.5">
              <Label htmlFor="ob-name">Full name</Label>
              <Input
                id="ob-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Carter"
                autoFocus
                autoComplete="name"
              />
            </div>
            <PrimaryCTA
              onClick={saveName}
              loading={saving}
              label="Continue"
              disabled={displayName.trim().length < 2}
            />
          </StepShell>
        )}

        {step === "phone" && (
          <StepShell
            icon={<PhoneIcon className="h-7 w-7 text-primary-foreground" />}
            title="Verify your phone"
            subtitle="We'll text you a 6-digit code. This protects your account and enables transfer alerts."
          >
            <div className="space-y-1.5">
              <Label htmlFor="ob-phone">Phone number</Label>
              <Input
                id="ob-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+14155551234"
                autoComplete="tel"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Standard message rates may apply. Reply STOP anytime.
              </p>
            </div>
            <PrimaryCTA onClick={sendCode} loading={sending} label="Send verification code" />
            <button
              type="button"
              onClick={() => setStep("how")}
              className="mt-2 block w-full py-2 text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
          </StepShell>
        )}

        {step === "code" && (
          <StepShell
            icon={<ShieldCheck className="h-7 w-7 text-primary-foreground" />}
            title="Enter the 6-digit code"
            subtitle={`Sent to ${phone}`}
          >
            <div className="flex justify-center pt-1">
              <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-12 w-10 text-base" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <PrimaryCTA
              onClick={verify}
              loading={verifying}
              label="Verify"
              disabled={code.length < 4}
            />
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-muted-foreground hover:text-foreground"
              >
                Change number
              </button>
              <button
                type="button"
                onClick={sendCode}
                disabled={sending}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {sending ? "Sending…" : "Resend code"}
              </button>
            </div>
          </StepShell>
        )}

        {step === "how" && (
          <StepShell
            icon={<Sparkles className="h-7 w-7 text-primary-foreground" />}
            title="How a secure transfer works"
            subtitle="Three simple steps. You stay in control the entire time."
          >
            <HowStep n={1} title="Send" desc="Choose a recipient and amount. Funds are held securely." />
            <HowStep n={2} title="Share a 4-digit code" desc="Only you and the recipient know it." />
            <HowStep n={3} title="Both confirm to release" desc="Funds release the moment you both enter the same code." />
            <PrimaryCTA onClick={() => setStep("done")} label="Continue" />
          </StepShell>
        )}

        {step === "done" && (
          <StepShell
            icon={<CheckCircle2 className="h-8 w-8 text-primary-foreground" />}
            title="You're all set"
            subtitle="Your account is ready. Send your first secure transfer in seconds."
          >
            <div className="rounded-2xl bg-accent-soft p-4 text-sm text-accent-foreground">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" /> Account secured
              </div>
              <p className="mt-1 text-xs opacity-90">
                Phone verified, identity ready. You can manage everything from your profile.
              </p>
            </div>
            <PrimaryCTA onClick={finish} label="Send my first transfer" />
            <button
              type="button"
              onClick={() => {
                if (user) localStorage.setItem(`lp_onboarded_${user.id}`, "1");
                navigate("/", { replace: true });
              }}
              className="mt-2 block w-full py-2 text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Go to dashboard
            </button>
          </StepShell>
        )}
      </div>
    </div>
  );
}

function StepShell({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page-enter flex flex-1 flex-col">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-elevated">
          {icon}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mx-auto mt-2 max-w-[18rem] text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-1 flex-col gap-3">{children}</div>
    </div>
  );
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function HowStep({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {n}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function PrimaryCTA({
  onClick,
  label,
  loading,
  disabled,
}: {
  onClick: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "mt-auto h-12 w-full rounded-2xl text-base font-semibold shadow-elevated",
        "active:scale-[0.98] transition-transform",
      )}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ArrowRight className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
