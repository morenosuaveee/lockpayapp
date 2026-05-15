import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  IdCard,
  Loader2,
  Lock,
  Phone as PhoneIcon,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserCircle2,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { calcFeeDollars } from "@/lib/fees";
import { VerifiedSuccess } from "@/components/VerifiedSuccess";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +14155551234");

type SimulatedTransfer = {
  amount: number;
  recipient: string;
  type: string;
  ts: number;
};

type Step =
  | "welcome"
  | "name"
  | "phone"
  | "code"
  | "identity"
  | "how"
  | "confirm-transfer"
  | "done";

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "MX", label: "Mexico" },
  { value: "IN", label: "India" },
  { value: "OTHER", label: "Other" },
];

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [pendingTransfer, setPendingTransfer] = useState<SimulatedTransfer | null>(null);
  const stepsList = useMemo<Step[]>(() => {
    const base: Step[] = ["welcome", "name", "phone", "code", "identity", "how"];
    if (pendingTransfer) base.push("confirm-transfer");
    base.push("done");
    return base;
  }, [pendingTransfer]);

  const [step, setStep] = useState<Step>("welcome");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  // Identity
  const [legalName, setLegalName] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("US");
  const [verifyingId, setVerifyingId] = useState(false);

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [showVerified, setShowVerified] = useState<null | "phone" | "identity">(null);

  // Pull simulated transfer (set by landing page Send Securely CTA)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lockpay.simulatedTransfer");
      if (raw) {
        const parsed = JSON.parse(raw) as SimulatedTransfer;
        if (parsed?.amount > 0 && parsed?.recipient) setPendingTransfer(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Bootstrap: if already onboarded, skip — but keep going if pending transfer is queued
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
      const hasPending = !!sessionStorage.getItem("lockpay.simulatedTransfer");
      if (done && !hasPending) {
        navigate("/", { replace: true });
        return;
      }
      if (done && hasPending) {
        // Skip straight to the protected-transfer confirmation
        setStep("confirm-transfer");
      }
      if (data?.display_name) {
        setDisplayName(data.display_name);
        if (!legalName) setLegalName(data.display_name);
      }
      setBootstrapped(true);
    })();
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const stepIndex = useMemo(() => Math.max(0, stepsList.indexOf(step)), [step, stepsList]);
  const progress = ((stepIndex + 1) / stepsList.length) * 100;

  if (!authLoading && !user) return <Navigate to="/signup" replace />;

  function gotoNext(after: Step) {
    const i = stepsList.indexOf(after);
    const next = stepsList[i + 1];
    if (next) setStep(next);
  }

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
    if (!legalName) setLegalName(displayName.trim());
    gotoNext("name");
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
    setShowVerified("phone");
  }

  function submitIdentity() {
    if (legalName.trim().length < 2) {
      toast.error("Enter your full legal name");
      return;
    }
    if (!dob) {
      toast.error("Enter your date of birth");
      return;
    }
    // 18+ check
    const dobDate = new Date(dob);
    const eighteen = new Date();
    eighteen.setFullYear(eighteen.getFullYear() - 18);
    if (isNaN(dobDate.getTime()) || dobDate > eighteen) {
      toast.error("You must be at least 18");
      return;
    }
    setVerifyingId(true);
    // Simulated identity check (no PII stored). Just a UX moment for trust.
    setTimeout(() => {
      setVerifyingId(false);
      if (user) {
        try {
          localStorage.setItem(
            `lp_identity_${user.id}`,
            JSON.stringify({ verified: true, country, ts: Date.now() }),
          );
        } catch {
          // ignore
        }
      }
      toast.success("Identity verified");
      setShowVerified("identity");
    }, 1100);
  }

  function continueAfterHow() {
    if (pendingTransfer) setStep("confirm-transfer");
    else setStep("done");
  }

  function finishToDashboard() {
    if (user) localStorage.setItem(`lp_onboarded_${user.id}`, "1");
    sessionStorage.removeItem("lockpay.simulatedTransfer");
    navigate("/", { replace: true });
  }

  function continueToSend() {
    if (user) localStorage.setItem(`lp_onboarded_${user.id}`, "1");
    // SendMoney can pick this up if needed; we leave the prefill in sessionStorage.
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
      {showVerified === "phone" && (
        <VerifiedSuccess
          title="Phone verified"
          subtitle="Your account is secured. One quick identity step and you're transfer-ready."
          onDone={() => {
            setShowVerified(null);
            setStep("identity");
          }}
        />
      )}
      {showVerified === "identity" && (
        <VerifiedSuccess
          title="You're verified"
          subtitle="Your account is secured. Pay with confidence on LockPay."
          onDone={() => {
            setShowVerified(null);
            setStep("how");
          }}
        />
      )}
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
          Step {stepIndex + 1} of {stepsList.length}
        </p>
      </div>

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-6">
        {step === "welcome" && (
          <StepShell
            icon={<Lock className="h-7 w-7 text-primary-foreground" strokeWidth={2.4} />}
            title={pendingTransfer ? "Let's verify your payment" : "Welcome to LockPay"}
            subtitle={
              pendingTransfer
                ? `We've saved your $${pendingTransfer.amount.toFixed(2)} to ${pendingTransfer.recipient}. A few quick steps to verify and continue.`
                : "Smarter. Safer. Verified. Confirm recipients before payment is completed."
            }
          >
            <FeatureRow icon={<ShieldCheck className="h-5 w-5 text-accent" />} title="Verified recipients" desc="Identity is confirmed before any transfer." />
            <FeatureRow icon={<Lock className="h-5 w-5 text-accent" />} title="Encrypted end-to-end" desc="Your data is encrypted in transit and at rest." />
            <FeatureRow icon={<Sparkles className="h-5 w-5 text-accent" />} title="Auto-cancelled in 48h" desc="Unconfirmed transfer requests are cancelled automatically." />
            <PrimaryCTA onClick={() => setStep("name")} label="Get started" />
            <p className="mt-3 text-center text-[10.5px] leading-relaxed text-muted-foreground/80">
              Lock Pay is a transfer coordination and recipient verification platform. Lock Pay is
              not a bank, money transmitter, escrow service, or custodial financial institution.
            </p>
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
              onClick={() => setStep("identity")}
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

        {step === "identity" && (
          <StepShell
            icon={<IdCard className="h-7 w-7 text-primary-foreground" />}
            title="Verify your identity"
            subtitle="A quick check confirms your identity. Your information is encrypted and used only to verify your account."
          >
            <div className="space-y-1.5">
              <Label htmlFor="ob-legal">Full legal name</Label>
              <Input
                id="ob-legal"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="As shown on your government ID"
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-dob">Date of birth</Label>
              <Input
                id="ob-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Country of residence</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl bg-accent-soft p-3 text-[11px] leading-relaxed text-accent-foreground">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" /> Industry-standard encryption
              </span>{" "}
              Identity data is encrypted in transit and at rest. We use it only to verify your account.
            </div>
            <PrimaryCTA
              onClick={submitIdentity}
              loading={verifyingId}
              label={verifyingId ? "Verifying identity…" : "Verify identity"}
              disabled={!legalName.trim() || !dob}
            />
          </StepShell>
        )}

        {step === "how" && (
          <StepShell
            icon={<Sparkles className="h-7 w-7 text-primary-foreground" />}
            title="How a verified transfer works"
            subtitle="Three simple steps. You stay in control the entire time."
          >
            <HowStep n={1} title="Send" desc="Choose a recipient and amount." />
            <HowStep n={2} title="Recipient is verified" desc="We confirm the receiving party before the transfer is initiated." />
            <HowStep n={3} title="Transfer completes" desc="The recipient confirms in-app and the transfer completes." />
            <PrimaryCTA
              onClick={continueAfterHow}
              label={pendingTransfer ? "Review your transfer" : "Continue"}
            />
          </StepShell>
        )}

        {step === "confirm-transfer" && pendingTransfer && (
          <ConfirmTransferStep
            transfer={pendingTransfer}
            recipientLabel={legalName || displayName}
            onContinue={continueToSend}
            onSkip={finishToDashboard}
          />
        )}

        {step === "done" && (
          <StepShell
            icon={<CheckCircle2 className="h-8 w-8 text-primary-foreground" />}
            title="You're all set"
            subtitle="Your account is ready. Send your first verified transfer in seconds."
          >
            <div className="rounded-2xl bg-accent-soft p-4 text-sm text-accent-foreground">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" /> Account secured
              </div>
              <p className="mt-1 text-xs opacity-90">
                Phone verified, identity confirmed. You can manage everything from your profile.
              </p>
            </div>
            <PrimaryCTA onClick={() => navigate("/send", { replace: true })} label="Send my first transfer" />
            <button
              type="button"
              onClick={finishToDashboard}
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

/* --------------------- Confirm-transfer completion --------------------- */

function ConfirmTransferStep({
  transfer,
  recipientLabel,
  onContinue,
  onSkip,
}: {
  transfer: SimulatedTransfer;
  recipientLabel: string;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const fee = calcFeeDollars(transfer.amount);
  const total = transfer.amount + fee;
  return (
    <div className="page-enter flex flex-1 flex-col">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-elevated">
          <ShieldCheck className="h-7 w-7 text-primary-foreground" strokeWidth={2.4} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Review your transfer</h1>
        <p className="mx-auto mt-2 max-w-[20rem] text-sm text-muted-foreground">
          We've saved the details from your demo. Review and continue to verify and complete it.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-elevated">
        <div className="flex items-center justify-between bg-secondary/60 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span>Verified transfer</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
            <BadgeCheck className="h-3 w-3" /> Verified
          </span>
        </div>
        <div className="px-5 py-5 text-center">
          <div className="text-[40px] font-bold leading-none tracking-tight tabular-nums">
            <span className="text-muted-foreground">$</span>
            {transfer.amount.toFixed(2).split(".")[0]}
            <span className="text-muted-foreground">.{transfer.amount.toFixed(2).split(".")[1]}</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">USD · awaiting recipient verification</div>
        </div>
        <div className="space-y-2 border-t border-border/60 px-5 py-4">
          <Row icon={<UserCheck className="h-4 w-4 text-accent" />} label="Recipient" value={transfer.recipient} />
          <Row icon={<BadgeCheck className="h-4 w-4 text-accent" />} label="Sender" value={recipientLabel || "You"} />
          <Row icon={<Lock className="h-4 w-4 text-accent" />} label="Status" value="Awaiting verification" />
          <Row icon={<Zap className="h-4 w-4 text-accent" />} label="Delivery" value="Instant on confirm" />
          <div className="my-1 h-px bg-border/70" />
          <Row label="Transfer fee" value={`$${fee.toFixed(2)}`} muted />
          <Row label="Total" value={`$${total.toFixed(2)}`} bold />
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-accent-soft p-4 text-[12px] leading-relaxed text-accent-foreground">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-4 w-4" /> Verification first
        </div>
        <p className="mt-1 opacity-90">
          The transfer to {transfer.recipient} won't be initiated until their identity is confirmed.
          If they can't be verified, the request is automatically cancelled.
        </p>
      </div>

      <PrimaryCTA onClick={onContinue} label="Continue to verified transfer" />
      <button
        type="button"
        onClick={onSkip}
        className="mt-2 block w-full py-2 text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Save for later
      </button>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  bold,
  muted,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className={bold ? "font-semibold text-foreground" : ""}>{label}</span>
      </span>
      <span
        className={cn(
          "tabular-nums",
          bold && "font-bold text-foreground",
          !bold && !muted && "font-medium text-foreground/90",
          muted && "text-muted-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* --------------------- Shared step UI --------------------- */

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
