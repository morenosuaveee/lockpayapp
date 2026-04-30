import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, RefreshCw, Sparkles, Copy, Check } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CodeInput } from "@/components/CodeInput";
import { generateCode, hashCode } from "@/lib/unlock-code";
import { getProvider } from "@/lib/payments/providers";
import { toast } from "sonner";

const schema = z.object({
  recipient: z.string().trim().min(3, "Enter recipient").max(255),
  amount: z.coerce.number().positive("Amount must be positive").max(10000),
  note: z.string().max(140).optional(),
});

type Step = "details" | "code" | "review" | "done";

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

  const handleGenerate = () => { setCode(generateCode()); };

  const handleConfirm = async () => {
    if (code.length !== 4) { toast.error("Enter a 4-digit unlock code"); return; }
    setLoading(true);
    try {
      // Create txn row first to get id (used as salt)
      const { data: prof } = await supabase.from("profiles").select("paypal_email").eq("id", user!.id).maybeSingle();
      const tempId = crypto.randomUUID();
      const hash = await hashCode(code, tempId);

      const { data: txn, error } = await supabase.from("transactions").insert({
        id: tempId,
        sender_id: user!.id,
        sender_paypal_email: prof?.paypal_email ?? null,
        recipient_identifier: recipient.trim(),
        amount: Number(amount),
        currency: "USD",
        provider: "paypal",
        status: "locked",
        unlock_code_hash: hash,
        note: note.trim() || null,
      }).select().single();

      if (error || !txn) throw error ?? new Error("Failed to create transaction");

      // Initiate mock PayPal payment
      const provider = getProvider("paypal");
      await provider.initiatePayment({
        amount: Number(amount),
        currency: "USD",
        senderAccount: prof?.paypal_email ?? "sender@paypal",
        recipientAccount: recipient.trim(),
        reference: txn.id,
      });

      setCreatedId(txn.id);
      setStep("done");
      toast.success("Payment locked in escrow");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create payment");
    } finally { setLoading(false); }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AppShell>
      <div className="px-5 pt-12 pb-6">
        <button onClick={() => step === "details" ? navigate(-1) : setStep(step === "code" ? "details" : "code")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card">
          <ArrowLeft className="h-5 w-5" />
        </button>

        {step === "details" && (
          <div className="mt-6 animate-slide-up">
            <h1 className="text-2xl font-bold">Send money</h1>
            <p className="mt-1 text-sm text-muted-foreground">Funds stay locked until both of you enter the code.</p>

            <div className="mt-6 space-y-5 rounded-3xl bg-card p-5 shadow-card">
              <div className="space-y-1.5">
                <Label htmlFor="rec">Recipient</Label>
                <Input id="rec" value={recipient} onChange={(e) => setRecipient(e.target.value)}
                  placeholder="email, phone, or @username" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amt">Amount (USD)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
                  <Input id="amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00" className="h-16 pl-9 text-3xl font-bold tabular-nums" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={140}
                  placeholder="Concert tickets — split" rows={2} />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
                <Sparkles className="h-4 w-4 text-accent" />
                Payment processor: <span className="font-semibold text-foreground">PayPal</span>
              </div>
            </div>

            <Button onClick={handleNext} className="mt-5 w-full h-14 rounded-2xl text-base font-semibold">
              Continue
            </Button>
          </div>
        )}

        {step === "code" && (
          <div className="mt-6 animate-slide-up">
            <h1 className="text-2xl font-bold">Set unlock code</h1>
            <p className="mt-1 text-sm text-muted-foreground">Both of you must enter this 4-digit code to release the funds.</p>

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
              <p className="mt-4 text-center text-xs text-muted-foreground">
                💡 Share this code with the recipient outside the app (text, in person…).
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-secondary p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sending</span>
                <span className="font-semibold tabular-nums">${Number(amount || 0).toFixed(2)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="font-semibold">{recipient}</span>
              </div>
            </div>

            <Button onClick={handleConfirm} disabled={loading || code.length !== 4}
              className="mt-5 w-full h-14 rounded-2xl text-base font-semibold gradient-primary text-primary-foreground hover:opacity-90">
              <Lock className="mr-2 h-5 w-5" />
              {loading ? "Locking…" : "Lock & send"}
            </Button>
          </div>
        )}

        {step === "done" && createdId && (
          <div className="mt-12 flex flex-col items-center text-center animate-unlock-burst">
            <div className="flex h-24 w-24 items-center justify-center rounded-full gradient-lock animate-lock-pulse">
              <Lock className="h-10 w-10 text-lock-foreground" strokeWidth={2.4} />
            </div>
            <h1 className="mt-6 text-2xl font-bold">Locked & on hold</h1>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              ${Number(amount).toFixed(2)} is held in escrow. Share the code <span className="font-bold text-foreground">{code}</span> with {recipient}.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Auto-refunds in 48h if not unlocked.</p>

            <div className="mt-8 w-full space-y-2">
              <Button onClick={() => navigate(`/unlock/${createdId}`)}
                className="w-full h-14 rounded-2xl text-base font-semibold">
                View transaction
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}
                className="w-full h-14 rounded-2xl text-base font-semibold bg-card">
                Back home
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
