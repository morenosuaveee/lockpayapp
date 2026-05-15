import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, RefreshCw, Copy, Check, Loader2, ShieldCheck, Lock,
  UserCheck, Send as SendIcon, AlertCircle, CheckCircle2, Mail, Phone,
} from "lucide-react";
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
import { SuccessMark } from "@/components/SuccessMark";
import { RecipientLookupCard, type LookupState } from "@/components/RecipientLookupCard";
import { generateCode, hashCode } from "@/lib/unlock-code";
import { calcFeeDollars } from "@/lib/fees";
import { toast } from "sonner";

const schema = z.object({
  recipient: z.string().trim().min(3, "Enter a recipient").max(255),
  amount: z.coerce.number().positive("Enter an amount").max(20, "Capped at $20 for now"),
  note: z.string().max(140).optional(),
});

type Step = "details" | "code" | "pay" | "invited";
type Lookup = LookupState;

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isPhone = (v: string) => /^\+?[\d\s\-().]{7,}$/.test(v.trim());

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
  const [txnStatus, setTxnStatus] = useState<string | null>(null);
  const [lookup, setLookup] = useState<Lookup>({ state: "idle" });
  const amountRef = useRef<HTMLInputElement>(null);

  const recipientType = isEmail(recipient) ? "email" : isPhone(recipient) ? "phone" : null;

  // Auto-focus amount when entering details
  useEffect(() => {
    if (step === "details") {
      const t = setTimeout(() => amountRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Debounced live recipient lookup
  useEffect(() => {
    const v = recipient.trim();
    if (!v) { setLookup({ state: "idle" }); return; }
    if (!recipientType) { setLookup({ state: "invalid" }); return; }
    setLookup({ state: "checking" });
    const t = setTimeout(async () => {
      const norm = recipientType === "email" ? v.toLowerCase() : v;
      const { data, error } = await supabase.rpc("lookup_recipient", {
        _identifier: norm, _channel: recipientType,
      });
      if (error) { setLookup({ state: "will_invite" }); return; }
      const r = (data ?? {}) as { exists?: boolean; verified?: boolean };
      if (r.exists) setLookup({ state: "lockpay_user", verified: !!r.verified });
      else setLookup({ state: "will_invite" });
    }, 380);
    return () => clearTimeout(t);
  }, [recipient, recipientType]);

  // Realtime watcher for invited transactions: when recipient_confirmed → jump to pay step
  useEffect(() => {
    if (!createdId || step !== "invited") return;
    const channel = supabase.channel(`send-tx-${createdId}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "transactions", filter: `id=eq.${createdId}` },
        async (payload) => {
          const next = payload.new as { status: string };
          setTxnStatus(next.status);
          if (next.status === "recipient_confirmed") {
            try {
              await supabase.rpc("mark_invite_pending_payment", { _txn_id: createdId });
              setStep("pay");
              toast.success("Recipient confirmed — complete payment to release funds");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not advance to payment");
            }
          }
        }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [createdId, step]);

  const amountNum = Number(amount) || 0;
  const feeNum = calcFeeDollars(amountNum);
  const totalNum = amountNum + feeNum;
  const canContinueDetails = !!recipientType && amountNum > 0 && amountNum <= 20;

  const handleNext = () => {
    const parsed = schema.safeParse({ recipient, amount, note });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setStep("code");
  };

  const handleGenerate = () => setCode(generateCode());

  const handleConfirm = async () => {
    if (code.length !== 4) { toast.error("Enter a 4-digit code"); return; }
    if (!recipientType) { toast.error("Invalid recipient"); return; }
    setLoading(true);
    try {
      const { data: prof } = await supabase.from("profiles").select("paypal_email").eq("id", user!.id).maybeSingle();
      const tempId = crypto.randomUUID();
      const hash = await hashCode(code, tempId);
      const norm = recipientType === "email" ? recipient.trim().toLowerCase() : recipient.trim();
      const isExistingUser = lookup.state === "lockpay_user";

      const { data: txn, error } = await supabase.from("transactions").insert({
        id: tempId,
        sender_id: user!.id,
        sender_paypal_email: prof?.paypal_email ?? null,
        recipient_identifier: norm,
        amount: amountNum,
        fee_amount: feeNum,
        currency: "USD",
        provider: "paypal",
        status: isExistingUser ? "pending_payment" : "pending_invite",
        unlock_code_hash: hash,
        note: note.trim() || null,
        recipient_channel: recipientType,
      }).select().single();

      if (error || !txn) throw error ?? new Error("Could not create transfer");
      setCreatedId(txn.id);
      setTxnStatus(txn.status);

      if (isExistingUser) {
        setStep("pay");
      } else {
        const { error: invErr } = await supabase.functions.invoke("send-transfer-invite", {
          body: { transactionId: txn.id },
        });
        if (invErr) throw invErr;
        setStep("invited");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create transfer");
    } finally { setLoading(false); }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const stepIndex = step === "details" ? 0 : step === "code" ? 1 : 2;

  const handleBack = () => {
    if (step === "details") navigate(-1);
    else if (step === "code") setStep("details");
    else if (step === "invited") navigate("/transactions");
    else setStep("code");
  };

  return (
    <AppShell>
      <PaymentTestModeBanner />
      <div className="px-5 pt-5 pb-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            aria-label="Back"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 active:scale-90 active:bg-secondary transition-all"
          >
            <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={2.2} />
          </button>
          <div className="flex flex-1 items-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= stepIndex ? "bg-foreground" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1 — Details */}
        {step === "details" && (
          <div key="details" className="mt-7 animate-fade-in">
            <h1 className="text-[28px] font-bold tracking-tight">Send</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">Confirmed by both sides with a 4-digit code.</p>

            {/* Amount */}
            <div className="mt-7 flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-muted-foreground">$</span>
                <input
                  ref={amountRef}
                  inputMode="decimal"
                  enterKeyHint="next"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0"
                  aria-label="Amount in USD"
                  className="w-[200px] bg-transparent text-center text-[64px] font-bold tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/30 caret-accent"
                />
              </div>
              <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">USD · Max $20</div>
            </div>

            {/* Recipient + note card */}
            <div className="mt-7 divide-y divide-border/60 rounded-3xl bg-card shadow-card">
              <div className="px-4 py-3.5">
                <Label htmlFor="rec" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">To</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    id="rec"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Email or phone"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    className="h-9 border-0 bg-transparent px-0 text-[17px] font-medium shadow-none focus-visible:border-0 focus-visible:ring-0"
                  />
                  {recipientType && (
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[10px] font-semibold text-foreground/70 animate-fade-in">
                      {recipientType === "email" ? <Mail className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                      {recipientType === "email" ? "Email" : "Phone"}
                    </span>
                  )}
                </div>
              </div>
              <div className="px-4 py-3.5">
                <Label htmlFor="note" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Note</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={140}
                  placeholder="What's it for? (optional)"
                  rows={1}
                  enterKeyHint="done"
                  className="min-h-0 resize-none border-0 bg-transparent px-0 py-1 text-[15px] shadow-none focus-visible:border-0 focus-visible:ring-0"
                />
              </div>
            </div>

            {/* Live recipient lookup state */}
            <RecipientLookupCard lookup={lookup} identifier={recipient} channel={recipientType} />

            {/* Fee preview */}
            {amountNum > 0 && (
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-3 text-[13px] animate-fade-in">
                <span className="text-muted-foreground">Fee · 1% (min $0.50)</span>
                <span className="font-semibold tabular-nums">${feeNum.toFixed(2)}</span>
              </div>
            )}

            <CtaBar>
              <Button
                onClick={handleNext}
                disabled={!canContinueDetails}
                className="w-full h-[54px] rounded-2xl text-[17px] font-semibold active:scale-[0.98] transition-transform shadow-elevated"
              >
                {amountNum > 0 ? `Continue · $${totalNum.toFixed(2)}` : "Continue"}
              </Button>
            </CtaBar>
          </div>
        )}

        {/* STEP 2 — Code */}
        {step === "code" && (
          <div key="code" className="mt-7 animate-fade-in">
            <h1 className="text-[28px] font-bold tracking-tight">Confirmation code</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">Share with the recipient. Both enter to confirm.</p>

            <div className="mt-10">
              <CodeInput value={code} onChange={setCode} masked={false} autoFocus />
              <div className="mt-7 flex justify-center gap-2">
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-[13px] font-semibold shadow-card active:scale-95 transition-transform"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Generate
                </button>
                {code.length === 4 && (
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-[13px] font-semibold shadow-card active:scale-95 transition-transform animate-fade-in"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-10 rounded-3xl bg-card p-5 shadow-card">
              <SummaryRow label="To" value={<span className="max-w-[60%] truncate">{recipient}</span>} />
              <SummaryRow label="Amount" value={`$${amountNum.toFixed(2)}`} />
              <SummaryRow label="Fee" value={`$${feeNum.toFixed(2)}`} />
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                <span className="text-[14px] font-semibold">Total</span>
                <span className="text-[17px] font-bold tabular-nums">${totalNum.toFixed(2)}</span>
              </div>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-accent" />
              Keep this code private — share off-app.
            </p>

            <CtaBar>
              <Button
                onClick={handleConfirm}
                disabled={loading || code.length !== 4}
                className="w-full h-[54px] rounded-2xl text-[17px] font-semibold gradient-primary text-primary-foreground shadow-elevated active:scale-[0.98] transition-transform"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
                {loading
                  ? "Preparing…"
                  : lookup.state === "lockpay_user"
                  ? "Continue to payment"
                  : "Send invite"}
              </Button>
            </CtaBar>
          </div>
        )}

        {/* STEP 3a — Invited (waiting on recipient) */}
        {step === "invited" && createdId && (
          <div key="invited" className="mt-8 animate-fade-in flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent-soft">
                <SendIcon className="h-10 w-10 text-accent-foreground" />
              </div>
              <span className="absolute inset-0 rounded-full ring-4 ring-accent/30 animate-success-ring" />
            </div>
            <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Invite sent</p>
            <h1 className="mt-1.5 text-[26px] font-bold tracking-tight">Waiting on {recipient}</h1>
            <p className="mt-2 max-w-[300px] text-[13px] text-muted-foreground text-balance">
              We sent them a secure link via {recipientType === "email" ? "email" : "SMS"}. They'll create a free
              LockPay account and confirm with the 4-digit code. You'll be charged only after they confirm.
            </p>

            <div className="mt-7 w-full rounded-3xl bg-card p-5 shadow-card text-left">
              <SummaryRow label="To" value={<span className="max-w-[60%] truncate">{recipient}</span>} />
              <SummaryRow label="Amount" value={`$${amountNum.toFixed(2)}`} />
              <SummaryRow label="Fee" value={`$${feeNum.toFixed(2)}`} />
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                <span className="text-[13px] text-muted-foreground">Code</span>
                <span className="font-mono text-[15px] font-bold tracking-widest">{code}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lock-soft px-2.5 py-1 text-[11px] font-semibold text-lock-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {txnStatus === "recipient_confirmed" ? "Recipient confirmed" : "Awaiting recipient"}
                </span>
              </div>
            </div>

            <p className="mt-4 text-[11px] text-muted-foreground">
              You'll get a notification the moment they confirm. No charge yet.
            </p>

            <div className="mt-6 flex w-full flex-col gap-2">
              <Button asChild variant="outline" className="h-12 rounded-2xl bg-card">
                <a onClick={(e) => { e.preventDefault(); navigate("/transactions"); }} href="/transactions">
                  View activity
                </a>
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")} className="h-11 rounded-2xl text-muted-foreground">
                Back to home
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3b — Pay */}
        {step === "pay" && createdId && (
          <div key="pay" className="mt-7 animate-fade-in">
            <h1 className="text-[28px] font-bold tracking-tight">Confirm &amp; pay</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              <span className="font-semibold text-foreground">${amountNum.toFixed(2)}</span> to{" "}
              <span className="font-semibold text-foreground">{recipient}</span> · code{" "}
              <span className="font-mono font-bold text-foreground">{code}</span>
            </p>

            {txnStatus === "recipient_confirmed" && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-accent-soft px-4 py-3 text-[13px] animate-fade-in">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span className="font-semibold text-accent-foreground">Recipient confirmed</span>
                <span className="ml-auto text-muted-foreground">Ready to pay</span>
              </div>
            )}

            <div className="mt-6 overflow-hidden rounded-3xl bg-card shadow-card">
              <LockPayCheckout
                transactionId={createdId}
                amountInCents={Math.round(amountNum * 100)}
                feeInCents={Math.round(feeNum * 100)}
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

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 first:pt-0">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-[14px] font-semibold tabular-nums truncate ml-3">{value}</span>
    </div>
  );
}

function CtaBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-[calc(5.5rem+var(--safe-bottom))] z-20 mt-8 -mx-5 px-5 pb-2 pt-4 bg-gradient-to-t from-surface via-surface/95 to-transparent">
      {children}
    </div>
  );
}
