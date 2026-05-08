import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock, CheckCircle2, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { CodeInput } from "@/components/CodeInput";
import { StatusBadge } from "@/components/StatusBadge";
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
  amount: number; currency: string;
  status: "pending" | "locked" | "awaiting_confirmation" | "unlocked" | "completed" | "refunded" | "expired" | "cancelled";
  unlock_code_hash: string;
  sender_confirmed: boolean; receiver_confirmed: boolean;
  sender_attempts: number; receiver_attempts: number; max_attempts: number;
  expires_at: string; note: string | null; created_at: string;
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

  if (loading) {
    return <AppShell><div className="flex h-screen items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div></AppShell>;
  }
  if (!tx) {
    return <AppShell><div className="p-6 pt-12"><Button onClick={() => navigate(-1)} variant="outline">Back</Button><p className="mt-6 text-center text-muted-foreground">Transaction not found.</p></div></AppShell>;
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
        toast.success("Funds released! 🎉");
        const targets = [tx.sender_id, tx.recipient_id ?? user!.id].filter(Boolean) as string[];
        supabase.functions.invoke("send-push", {
          body: {
            user_ids: targets,
            title: "Payment unlocked 🔓",
            body: `$${Number(tx.amount).toFixed(2)} has been released to ${tx.recipient_identifier}.`,
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
      <div className="px-5 pt-12 pb-6">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card">
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Status hero */}
        <div className="mt-6 text-center">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
            isReleased ? "gradient-accent animate-unlock-burst" :
            tx.status === "expired" || tx.status === "cancelled" || tx.status === "refunded" ? "bg-muted" :
            "gradient-lock animate-lock-pulse"
          }`}>
            {isReleased ? <CheckCircle2 className="h-10 w-10 text-accent-foreground" /> :
             tx.status === "expired" ? <Clock className="h-10 w-10 text-muted-foreground" /> :
             tx.status === "refunded" ? <Clock className="h-10 w-10 text-muted-foreground" /> :
             tx.status === "cancelled" ? <AlertTriangle className="h-10 w-10 text-muted-foreground" /> :
             <Lock className="h-10 w-10 text-lock-foreground" />}
          </div>
          <div className="mt-4 text-4xl font-bold tabular-nums">${Number(tx.amount).toFixed(2)}</div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSender ? `To ${tx.recipient_identifier}` : `From ${tx.sender_paypal_email ?? "sender"}`}
          </p>
          <div className="mt-3 flex justify-center"><StatusBadge status={tx.status} /></div>
          {(tx.status === "locked" || tx.status === "awaiting_confirmation") && (
            <div className="mt-3 flex justify-center">
              <Countdown expiresAt={tx.expires_at} label="Auto-refund in" />
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
        {!finalState && !myConfirmed && (
          <div className="mt-6 rounded-3xl bg-card p-6 shadow-card">
            <h2 className="text-center text-base font-semibold">Enter the 4-digit unlock code</h2>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              {blocked ? "Attempts exhausted." : `${attemptsLeft} ${attemptsLeft === 1 ? "attempt" : "attempts"} left`}
            </p>
            <div className="mt-5">
              <CodeInput value={code} onChange={setCode} masked invalid={invalid} disabled={blocked || submitting} autoFocus />
            </div>
            <Button onClick={submitCode} disabled={blocked || submitting || code.length !== 4}
              className="mt-5 w-full h-14 rounded-2xl text-base font-semibold gradient-primary text-primary-foreground hover:opacity-90">
              <ShieldCheck className="mr-2 h-5 w-5" />
              {submitting ? "Verifying…" : "Confirm"}
            </Button>
          </div>
        )}

        {!finalState && myConfirmed && !otherConfirmed && (
          <div className="mt-6 rounded-3xl bg-accent-soft p-6 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-accent" />
            <p className="text-sm font-semibold">You've confirmed. Waiting on the other party.</p>
            <p className="mt-1 text-xs text-muted-foreground">They'll be notified to enter the code.</p>
          </div>
        )}

        {tx.status === "completed" && (
          <div className="mt-6 rounded-3xl bg-accent-soft p-6 text-center">
            <p className="text-sm font-semibold text-accent-foreground">Funds released to {tx.recipient_identifier}.</p>
          </div>
        )}
        {tx.status === "expired" && (
          <div className="mt-6 rounded-3xl bg-secondary p-6 text-center">
            <p className="text-sm font-semibold">Expired — refunded to sender (mock).</p>
          </div>
        )}
        {tx.status === "cancelled" && (
          <div className="mt-6 rounded-3xl bg-destructive-soft p-6 text-center">
            <p className="text-sm font-semibold text-destructive">Cancelled — too many wrong attempts.</p>
          </div>
        )}

        <div className="mt-6 space-y-1.5 rounded-2xl bg-secondary p-4 text-xs text-muted-foreground">
          <Row label="Created" value={formatDistanceToNowStrict(new Date(tx.created_at), { addSuffix: true })} />
          <Row label="Expires" value={formatDistanceToNowStrict(new Date(tx.expires_at), { addSuffix: true })} />
          <Row label="Provider" value="PayPal (mock)" />
          <Row label="Reference" value={tx.id.slice(0, 8).toUpperCase()} mono />
        </div>
      </div>
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
