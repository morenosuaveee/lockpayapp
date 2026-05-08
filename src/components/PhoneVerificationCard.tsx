import { useState } from "react";
import { ShieldCheck, Phone as PhoneIcon, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { z } from "zod";
import { format } from "date-fns";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +14155551234");

interface Props {
  initialPhone: string | null;
  verifiedAt: string | null;
  onVerified: (phone: string, at: string) => void;
}

export function PhoneVerificationCard({ initialPhone, verifiedAt, onVerified }: Props) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(verifiedAt ? initialPhone : null);
  const [verifiedTs, setVerifiedTs] = useState<string | null>(verifiedAt);
  const [step, setStep] = useState<"idle" | "code">("idle");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const isVerified = !!verifiedTs && phone.trim() === verifiedPhone;

  async function sendCode() {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("phone-verify-start", {
      body: { phone: parsed.data },
    });
    setSending(false);
    if (error || (data && (data as { error?: string }).error)) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Could not send code");
      return;
    }
    toast.success("Code sent — check your messages");
    setStep("code");
    setCode("");
  }

  async function verify() {
    if (code.length < 4) { toast.error("Enter the code"); return; }
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
    const now = new Date().toISOString();
    toast.success("Phone verified");
    setVerifiedPhone(phone.trim());
    setVerifiedTs(now);
    onVerified(phone.trim(), now);
    setStep("idle");
    setCode("");
  }

  return (
    <div className="rounded-3xl bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-accent" />
          Phone verification
        </h2>
        {isVerified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            <CheckCircle2 className="h-3 w-3" /> Verified
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Not verified
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Verify by SMS to receive transfer alerts and enable secure recovery.
      </p>

      {step === "idle" && (
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ph-verify"><PhoneIcon className="mr-1 inline h-3.5 w-3.5" />Phone number</Label>
            <Input
              id="ph-verify"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+14155551234"
              autoComplete="tel"
              disabled={isVerified}
            />
          </div>

          {isVerified ? (
            <>
              <p className="text-[11px] text-muted-foreground">
                Verified {verifiedTs ? format(new Date(verifiedTs), "MMM d, yyyy") : ""}.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => { /* allow re-verify by sending again */ sendCode(); }}
                disabled={sending}
              >
                {sending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Re-verify a new number
              </Button>
            </>
          ) : (
            <Button onClick={sendCode} disabled={sending} className="w-full h-11 rounded-xl">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {sending ? "Sending…" : "Send verification code"}
            </Button>
          )}
        </div>
      )}

      {step === "code" && (
        <div className="mt-4 space-y-4 animate-slide-up">
          <p className="text-xs text-muted-foreground">
            Enter the 6-digit code we sent to <span className="font-semibold text-foreground">{phone}</span>
          </p>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="h-12 w-10 text-base" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setStep("idle")}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl"
              onClick={verify}
              disabled={verifying || code.length < 4}
            >
              {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {verifying ? "Verifying…" : "Verify"}
            </Button>
          </div>
          <button
            type="button"
            onClick={sendCode}
            disabled={sending}
            className="block w-full text-center text-[11px] text-muted-foreground hover:text-foreground"
          >
            {sending ? "Sending…" : "Resend code"}
          </button>
        </div>
      )}
    </div>
  );
}
