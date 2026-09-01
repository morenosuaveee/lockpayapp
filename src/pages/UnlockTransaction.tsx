import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock, CheckCircle2, Clock, ShieldCheck, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { SuccessMark } from "@/components/SuccessMark";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { CodeInput } from "@/components/CodeInput";
import { StatusBadge } from "@/components/StatusBadge";
import { TransferTimeline } from "@/components/TransferTimeline";
import { RecipientVerifiedSuccess } from "@/components/RecipientVerifiedSuccess";
import { Countdown } from "@/components/Countdown";
import { verifyCode } from "@/lib/unlock-code";
import { getProvider } from "@/lib/payments/providers";
import { toast } from "sonner";
import { formatDistanceToNowStrict } from "date-fns";

interface Tx {
  id: string;
  sender_id: string;
  sender_paypal_email: string | null;
  recipient_id: string | null;
  recipient_identifier: string;
  amount: number; fee_amount?: number; currency: string;
  status: "pending" | "pending_invite" | "awaiting_recipient" | "recipient_confirmed" | "pending_payment" | "locked" | "awaiting_confirmation" | "unlocked" | "completed" | "refunded" | "expired" | "cancelled";
  unlock_code_hash: string;
  sender_confirmed: boolean; receiver_confirmed: boolean;
  sender_attempts: number; receiver_attempts: number; max_attempts: number;
  expires_at: string; note: string | null; created_at: string; recipient_confirmed_at?: string | null;
}

export default function UnlockTransaction() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tx, setTx] = useState<Tx | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [userPaypalEmail, setUserPaypalEmail] = useState<string | null>(null);
  const [showVerifiedHero, setShowVerifiedHero] = useState(false);
  const [verifiedDismissed, setVerifiedDismissed] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    let mounted = true;

    const load = async () => {
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase.from("transactions").select("*").eq("id", id).maybeSingle(),
        supabase.from("profiles").select("paypal_email").eq("id", user.id).maybeSingle(),
      ]);
      if (!mounted) return;
      if (t && new Date(t.expires_at) < new Date() && (t.status === "locked" || t.status === "awaiting_confirmation")) {
        // auto-expire client-side update
        await supabase.from("transactions").update({ status: "expired" }).eq("id", t.id);
        t.status = "expired";
      }
      setTx(t as Tx);
      setUserPaypalEmail(p?.paypal_email ?? null);
      setLoading(false);
    };
    load();

    const channel = supabase.channel(`tx-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "transactions", filter: `id=eq.${id}` },
        (payload) => setTx(payload.new as Tx))
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [id, user]);

  // Auto-open the premium "Recipient Verified" hero for the sender the
  // moment recipient confirms — this is LockPay's signature moment.
  // Must stay above the early returns below so hook order is stable.
  const senderId = tx?.sender_id;
  const txStatus = tx?.status;
  useEffect(() => {
    if (senderId && senderId === user?.id && txStatus === "recipient_confirmed" && !verifiedDismissed) {
      setShowVerifiedHero(true);
    }
  }, [senderId, user?.id, txStatus, verifiedDismissed]);

  if (loading) {
    return (
      <AppShell>
        <div className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-6 stagger">
          <div className="h-10 w-10 rounded-full skeleton-shimmer" />
          <div className="mx-auto mt-6 h-20 w-20 rounded-full skeleton-shimmer" />
          <div className="mx-auto mt-4 h-8 w-32 rounded-lg skeleton-shimmer" />
          <div className="mx-auto mt-2 h-4 w-40 rounded-full skeleton-shimmer" />
          <div className="mt-6 h-44 rounded-3xl skeleton-shimmer" />
          <div className="mt-4 h-32 rounded-3xl skeleton-shimmer" />
        </div>
      </AppShell>
    );
  }
  if (!tx) {
    return (
      <AppShell>
        <div className="p-6 pt-12 text-center animate-slide-up">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
            <AlertTriangle className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold">Transaction not found</p>
          <p className="mt-1 text-sm text-muted-foreground">It may have been removed or you don't have access.</p>
          <Button onClick={() => navigate(-1)} className="mt-5 h-12 rounded-2xl px-6">Go back</Button>
        </div>
      </AppShell>
    );
  }

  const isSender = tx.sender_id === user?.id;
  const isReceiver = !isSender; // (matched via RLS — they wouldn't see otherwise)
  const role: "sender" | "receiver" = isSender ? "sender" : "receiver";
  const myConfirmed = isSender ? tx.sender_confirmed : tx.receiver_confirmed;
  const otherConfirmed = isSender ? tx.receiver_confirmed : tx.sender_confirmed;
  const myAttempts = isSender ? tx.sender_attempts : tx.receiver_attempts;
  const attemptsLeft = tx.max_attempts - myAttempts;
  const blocked = attemptsLeft <= 0 && !myConfirmed;
  const releasedStates = ["unlocked", "completed"] as const;
  const isReleased = (releasedStates as readonly string[]).includes(tx.status);
  const finalState = isReleased || tx.status === "expired" || tx.status === "cancelled" || tx.status === "refunded";

  async function handleReleasePayment() {
    try {
      await supabase.rpc("mark_invite_pending_payment", { _txn_id: tx!.id });
      navigate(`/send?resume=${tx!.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start payment");
      throw e;
    }
  }


  async function submitCode() {
    if (!tx || code.length !== 4) return;
    setSubmitting(true); setInvalid(false);
    try {
      const ok = await verifyCode(code, tx.id, tx.unlock_code_hash);

      // log attempt
      await supabase.from("unlock_attempts").insert({
        transaction_id: tx.id, user_id: user!.id, role, success: ok,
      });

      if (!ok) {
        const newAttempts = myAttempts + 1;
        const update = isSender
          ? { sender_attempts: newAttempts }
          : { receiver_attempts: newAttempts };
        const remaining = tx.max_attempts - newAttempts;
        await supabase.from("transactions").update(update).eq("id", tx.id);

        if (remaining <= 0) {
          await supabase.from("transactions").update({ status: "cancelled" }).eq("id", tx.id);
          toast.error("Too many wrong attempts. Transaction cancelled.");
          const targets = [tx.sender_id, tx.recipient_id].filter(Boolean) as string[];
          if (targets.length) {
            supabase.functions.invoke("send-push", {
              body: {
                user_ids: targets,
                title: "Payment cancelled",
                body: `The $${Number(tx.amount).toFixed(2)} transfer was cancelled after too many wrong attempts.`,
                data: { transactionId: tx.id, type: "payment_cancelled" },
              },
            }).catch(() => {});
          }
        } else {
          toast.error(`Wrong code. ${remaining} ${remaining === 1 ? "try" : "tries"} left.`);
        }
        setInvalid(true); setCode("");
        return;
      }

      // Code correct — mark this party confirmed
      const update: Partial<Tx> = isSender
        ? { sender_confirmed: true }
        : { receiver_confirmed: true, recipient_id: user!.id };

      const newStatus = otherConfirmed ? "unlocked" : "awaiting_confirmation";
      await supabase.from("transactions").update({
        ...update, status: newStatus,
        ...(newStatus === "unlocked" ? { released_at: new Date().toISOString() } : {}),
      }).eq("id", tx.id);

      if (newStatus === "unlocked") {
        const provider = getProvider("paypal");
        await provider.releasePayment({
          providerRef: tx.id,
          recipientAccount: tx.recipient_identifier,
          amount: Number(tx.amount),
        });
        toast.success("Payment completed securely");
        const targets = [tx.sender_id, tx.recipient_id ?? user!.id].filter(Boolean) as string[];
        supabase.functions.invoke("send-push", {
          body: {
            user_ids: targets,
            title: "Payment completed",
            body: `$${Number(tx.amount).toFixed(2)} has been sent to ${tx.recipient_identifier}.`,
            data: { transactionId: tx.id, type: "payment_unlocked" },
          },
        }).catch(() => {});
      } else {
        toast.success("Code confirmed. Waiting for the other party.");
      }
      setCode("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to verify code");
    } finally { setSubmitting(false); }
  }

  return (
    <AppShell>
      <div className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-6">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card active:scale-95 transition-transform">
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Status hero */}
        <div className="mt-6 text-center">
          {isReleased ? (
            <SuccessMark tone="accent" size={104} />
          ) : (
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
              tx.status === "expired" || tx.status === "cancelled" || tx.status === "refunded" ? "bg-muted" :
              "gradient-lock animate-lock-pulse"
            }`}>
              {tx.status === "expired" ? <Clock className="h-10 w-10 text-muted-foreground" /> :
               tx.status === "refunded" ? <Clock className="h-10 w-10 text-muted-foreground" /> :
               tx.status === "cancelled" ? <AlertTriangle className="h-10 w-10 text-muted-foreground" /> :
               <Lock className="h-10 w-10 text-lock-foreground" />}
            </div>
          )}
          {isReleased && (
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Completed</p>
          )}
          <div className={`${isReleased ? "mt-2" : "mt-4"} text-4xl font-bold tabular-nums tracking-tight`}>
            ${Number(tx.amount).toFixed(2)}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSender ? `To ${tx.recipient_identifier}` : `From ${tx.sender_paypal_email ?? "sender"}`}
          </p>
          {!finalState && (
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-accent" /> Awaiting both confirmations
            </p>
          )}
          {!isReleased && <div className="mt-3 flex justify-center"><StatusBadge status={tx.status} /></div>}
          {(tx.status === "locked" || tx.status === "awaiting_confirmation") && (
            <div className="mt-3 flex justify-center">
              <Countdown expiresAt={tx.expires_at} label="Auto-cancel in" />
            </div>
          )}
          {tx.note && <p className="mt-3 text-sm italic text-muted-foreground">"{tx.note}"</p>}
        </div>

        {/* Confirmation chips */}
        {!finalState && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <ConfirmChip label="Sender" confirmed={tx.sender_confirmed} you={isSender} />
            <ConfirmChip label="Receiver" confirmed={tx.receiver_confirmed} you={isReceiver} />
          </div>
        )}

        {/* Code entry */}
        {/* Sender complete-payment CTA when recipient has confirmed */}
        {isSender && tx.status === "recipient_confirmed" && (
          <div className="mt-6 rounded-3xl bg-accent-soft p-5 shadow-card animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-accent-foreground">Recipient verified</p>
                <p className="mt-0.5 text-xs text-accent-foreground/80">
                  They've confirmed the verification code. Complete ${Number(tx.amount).toFixed(2)} securely when you're ready.
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setVerifiedDismissed(false);
                setShowVerifiedHero(true);
              }}
              className="mt-4 w-full h-12 rounded-2xl text-[15px] font-semibold gradient-accent text-accent-foreground"
            >
              <ShieldCheck className="mr-2 h-4 w-4" /> Review & complete
            </Button>
          </div>
        )}


        {(tx.status === "pending_invite" || tx.status === "awaiting_recipient") && isSender && (
          <div className="mt-6 rounded-3xl bg-card p-5 shadow-card text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">Waiting on {tx.recipient_identifier}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              We'll move this to payment as soon as they confirm. No charge yet.
            </p>
          </div>
        )}

        {!finalState && !myConfirmed && (tx.status === "locked" || tx.status === "awaiting_confirmation" || tx.status === "pending_payment") && (
          <div className="mt-6 rounded-3xl bg-card p-6 shadow-card">
            <h2 className="text-center text-base font-semibold">Enter the verification code</h2>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              {blocked
                ? "No attempts left — this payment was cancelled and any pending charge will be reversed."
                : `Get the verification code from ${isSender ? "the recipient" : "the sender"}. ${attemptsLeft} ${attemptsLeft === 1 ? "try" : "tries"} left.`}
            </p>
            <div className="mt-5">
              <CodeInput value={code} onChange={setCode} masked invalid={invalid} disabled={blocked || submitting} autoFocus />
            </div>
            <Button onClick={submitCode} disabled={blocked || submitting || code.length !== 4}
              className="mt-5 w-full h-14 rounded-2xl text-base font-semibold gradient-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-transform">
              {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
              {submitting ? "Verifying…" : "Confirm transfer"}
            </Button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              The transfer is initiated only when both of you enter the same code. Nothing happens until then.
            </p>
          </div>
        )}

        {!finalState && myConfirmed && !otherConfirmed && (
          <div className="mt-6 rounded-3xl bg-accent-soft p-6 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-accent" />
            <p className="text-sm font-semibold">You're confirmed</p>
            <p className="mt-1 text-xs text-muted-foreground">We've notified the other party. The transfer is initiated the moment they enter the same code.</p>
          </div>
        )}

        {isReleased && (
          <div className="mt-6 overflow-hidden rounded-3xl bg-card p-5 shadow-card animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft">
                <Sparkles className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Payment completed</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  ${Number(tx.amount).toFixed(2)} sent to <span className="font-medium text-foreground">{tx.recipient_identifier}</span>. Both parties confirmed — your payment is on its way.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 rounded-xl bg-accent-soft px-3 py-2 font-medium text-accent-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified payment
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 font-medium text-foreground/80">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Receipt logged
              </div>
            </div>
          </div>
        )}
        {tx.status === "refunded" && (
          <div className="mt-6 rounded-3xl bg-secondary p-6 text-center">
            <p className="text-sm font-semibold">Expired — refund issued to sender.</p>
          </div>
        )}
        {tx.status === "expired" && (
          <div className="mt-6 rounded-3xl bg-secondary p-6 text-center">
            <p className="text-sm font-semibold">Expired.</p>
          </div>
        )}
        {tx.status === "cancelled" && (
          <div className="mt-6 rounded-3xl bg-destructive-soft p-6 text-center">
            <p className="text-sm font-semibold text-destructive">Cancelled — too many wrong attempts.</p>
          </div>
        )}

        <TransferTimeline tx={tx as unknown as { status: string; created_at: string; invite_sent_at?: string | null; recipient_confirmed_at?: string | null; released_at?: string | null; expires_at?: string }} className="mt-6" />

        <div className="mt-4 space-y-1.5 rounded-2xl bg-secondary p-4 text-xs text-muted-foreground">
          <Row label="Created" value={relative(tx.created_at)} />
          <Row label="Expires" value={relative(tx.expires_at)} />
          <Row label="Provider" value="PayPal (mock)" />
          <Row label="Reference" value={(tx.id ?? "").slice(0, 8).toUpperCase() || "—"} mono />
        </div>

      </div>

      {showVerifiedHero && isSender && (tx.status === "recipient_confirmed" || tx.status === "pending_payment") && (
        <RecipientVerifiedSuccess
          recipientName={tx.recipient_identifier}
          amount={Number(tx.amount)}
          currency={tx.currency}
          timestamp={tx.recipient_confirmed_at ?? undefined}
          released={tx.status === "pending_payment"}
          onRelease={handleReleasePayment}
          onCancel={() => {
            setShowVerifiedHero(false);
            setVerifiedDismissed(true);
          }}
          onDismiss={() => {
            setShowVerifiedHero(false);
            setVerifiedDismissed(true);
          }}
        />
      )}
    </AppShell>
  );
}

function ConfirmChip({ label, confirmed, you }: { label: string; confirmed: boolean; you: boolean }) {
  return (
    <div className={`rounded-2xl p-3 text-center text-sm ${confirmed ? "bg-accent-soft" : "bg-secondary"}`}>
      <div className="text-xs text-muted-foreground">{label} {you && <span className="font-semibold">(you)</span>}</div>
      <div className={`mt-1 font-semibold ${confirmed ? "text-accent-foreground" : "text-muted-foreground"}`}>
        {confirmed ? "✓ Confirmed" : "Pending"}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className={mono ? "font-mono text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}
