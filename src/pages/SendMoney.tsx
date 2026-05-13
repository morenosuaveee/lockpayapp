import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, RefreshCw, Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CodeInput } from "@/components/CodeInput";
import { LockPayCheckout } from "@/components/LockPayCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { generateCode, hashCode } from "@/lib/unlock-code";
import { calcFeeDollars } from "@/lib/fees";
import { toast } from "sonner";

const schema = z.object({
  recipient: z.string().trim().min(3, "Enter recipient").max(255),
  amount: z.coerce.number().positive("Amount must be positive").max(20, "Amount is capped at $20 for now"),
  note: z.string().max(140).optional(),
});

type Step = "details" | "code" | "pay";

export default function SendMoney() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("details");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const handleNext = () => {
    const parsed = schema.safeParse({ recipient, amount, note });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setStep("code");
  };

  const handleGenerate = () => setCode(generateCode());

  const handleConfirm = async () => {
    if (code.length !== 4) { toast.error("Enter a 4-digit unlock code"); return; }
    setLoading(true);
    try {
      const { data: prof } = await supabase.from("profiles").select("paypal_email").eq("id", user!.id).maybeSingle();
      const tempId = crypto.randomUUID();
      const hash = await hashCode(code, tempId);

      const amountNum = Number(amount);
      const feeNum = calcFeeDollars(amountNum);

      const { data: txn, error } = await supabase.from("transactions").insert({
        id: tempId,
        sender_id: user!.id,
        sender_paypal_email: prof?.paypal_email ?? null,
        recipient_identifier: recipient.trim(),
        amount: amountNum,
        fee_amount: feeNum,
        currency: "USD",
        provider: "paypal",
        status: "pending_payment",
        unlock_code_hash: hash,
        note: note.trim() || null,
      }).select().single();

      if (error || !txn) throw error ?? new Error("Failed to create transaction");

      setCreatedId(txn.id);
      setStep("pay");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create payment");
    } finally { setLoading(false); }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const stepIndex = step === "details" ? 0 : step === "code" ? 1 : 2;
  const stepLabels = ["Details", "Code", "Pay"];

  return (
    <AppShell>
      <PaymentTestModeBanner />
      <div className="px-5 pt-6 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => step === "details" ? navigate(-1) : setStep(step === "code" ? "details" : "code")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center gap-1.5">
            {stepLabels.map((lbl, i) => (
              <div key={lbl} className="flex flex-1 items-center gap-1.5">
                <div className={`h-1.5 flex-1 rounded-full transition-all ${i <= stepIndex ? "bg-primary" : "bg-secondary"}`} />
              </div>
            ))}
          </div>
          <span className="text-xs font-semibold tabular-nums text-muted-foreground">{stepIndex + 1}/3</span>
        </div>

        {step === "details" && (
          <div className="mt-6 animate-slide-up">
            <h1 className="text-2xl font-bold">Send money</h1>
            <p className="mt-1 text-sm text-muted-foreground">Funds are held in escrow and only released once you and the recipient both enter the same 4-digit code. Auto-refunded in 48h if not unlocked.</p>

            <div className="mt-6 space-y-5 rounded-3xl bg-card p-5 shadow-card">
              <div className="space-y-1.5">
                <Label htmlFor="rec">Recipient</Label>
                <Input id="rec" value={recipient} onChange={(e) => setRecipient(e.target.value)}
                  placeholder="email, phone, or @username"
                  autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                  enterKeyHint="next" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amt">Amount (USD)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
                  <Input id="amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00" className="h-16 pl-9 text-3xl font-bold tabular-nums"
                    enterKeyHint="next" autoComplete="off" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={140}
                  placeholder="Concert tickets — split" rows={2} enterKeyHint="done" />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
                <Sparkles className="h-4 w-4 text-accent" />
                Securely processed by <span className="font-semibold text-foreground">Stripe</span>. Your card is never stored on LockPay.
              </div>
            </div>

            <div className="sticky bottom-[calc(5.5rem+var(--safe-bottom))] z-20 mt-5 -mx-5 px-5 pb-2 pt-3 bg-gradient-to-t from-surface via-surface/95 to-transparent">
              <Button onClick={handleNext} className="w-full h-14 rounded-2xl text-base font-semibold active:scale-[0.98] transition-transform shadow-elevated">
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "code" && (
          <div className="mt-6 animate-slide-up">
            <h1 className="text-2xl font-bold">Set unlock code</h1>
            <p className="mt-1 text-sm text-muted-foreground">A 4-digit code that you and the recipient must both enter to release the funds. Keep it private.</p>

            <div className="mt-8 rounded-3xl bg-card p-6 shadow-card">
              <CodeInput value={code} onChange={setCode} masked={false} autoFocus />
              <div className="mt-5 flex justify-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={handleGenerate}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Generate
                </Button>
                {code.length === 4 && (
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={copyCode}>
                    {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                )}
              </div>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                Share this code with the recipient privately — text, in person, anywhere off-app.
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-secondary p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sending</span>
                <span className="font-semibold tabular-nums">${Number(amount || 0).toFixed(2)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">LockPay fee (1%, min $0.50)</span>
                <span className="font-semibold tabular-nums">${calcFeeDollars(Number(amount || 0)).toFixed(2)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-border/50 pt-2">
                <span className="text-muted-foreground">Total charged</span>
                <span className="font-semibold tabular-nums">${(Number(amount || 0) + calcFeeDollars(Number(amount || 0))).toFixed(2)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="font-semibold">{recipient}</span>
              </div>
            </div>

            <div className="sticky bottom-[calc(5.5rem+var(--safe-bottom))] z-20 mt-5 -mx-5 px-5 pb-2 pt-3 bg-gradient-to-t from-surface via-surface/95 to-transparent">
              <Button onClick={handleConfirm} disabled={loading || code.length !== 4}
                className="w-full h-14 rounded-2xl text-base font-semibold gradient-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-transform shadow-elevated">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
                {loading ? "Preparing…" : "Continue to payment"}
              </Button>
            </div>
          </div>
        )}

        {step === "pay" && createdId && (
          <div className="mt-6 animate-slide-up">
            <h1 className="text-2xl font-bold">Pay & lock</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ${Number(amount).toFixed(2)} held in escrow + ${calcFeeDollars(Number(amount)).toFixed(2)} LockPay fee. Released when <span className="font-semibold text-foreground">{recipient}</span> enters code <span className="font-mono font-bold text-foreground">{code}</span> with you.
            </p>

            <div className="mt-6 overflow-hidden rounded-3xl bg-card shadow-card">
              <LockPayCheckout
                transactionId={createdId}
                amountInCents={Math.round(Number(amount) * 100)}
                feeInCents={Math.round(calcFeeDollars(Number(amount)) * 100)}
                recipient={recipient.trim()}
                returnUrl={`${window.location.origin}/checkout/return?txn=${createdId}&session_id={CHECKOUT_SESSION_ID}`}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
