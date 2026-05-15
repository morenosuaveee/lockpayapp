import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Lock, ShieldCheck, Loader2, AlertCircle, ArrowRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CodeInput } from "@/components/CodeInput";
import { SuccessMark } from "@/components/SuccessMark";
import { StatusBadge } from "@/components/StatusBadge";
import { hashCode } from "@/lib/unlock-code";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["transaction_status"];

interface ClaimSummary {
  id: string;
  amount: number;
  fee_amount: number;
  currency: string;
  recipient_identifier: string;
  recipient_channel: string | null;
  note: string | null;
  status: Status;
  expires_at: string;
  invite_sent_at: string | null;
  recipient_confirmed_at: string | null;
  sender_display_name: string;
}

export default function Claim() {
  const { token = "" } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ClaimSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.rpc("claim_lookup", { _token: token });
      if (!mounted) return;
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        setSummary(null);
      } else {
        const row = Array.isArray(data) ? data[0] : data;
        setSummary(row as ClaimSummary);
        if ((row as ClaimSummary).status === "recipient_confirmed" ||
            (row as ClaimSummary).status === "locked" ||
            (row as ClaimSummary).status === "completed") {
          setConfirmed(true);
        }
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [token]);

  // Realtime updates
  useEffect(() => {
    if (!summary?.id) return;
    const channel = supabase.channel(`claim-${summary.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "transactions", filter: `id=eq.${summary.id}` },
        (payload) => {
          const next = payload.new as ClaimSummary & { status: Status };
          setSummary((prev) => prev ? { ...prev, status: next.status } : prev);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [summary?.id]);

  async function handleConfirm() {
    if (!summary) return;
    if (code.length !== 4) { toast.error("Enter the 4-digit code"); return; }
    setSubmitting(true);
    try {
      const hash = await hashCode(code, summary.id);
      const { error } = await supabase.rpc("recipient_confirm_claim", { _token: token, _code_hash: hash });
      if (error) throw error;
      setConfirmed(true);
      toast.success("Recipient confirmed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not confirm");
      setCode("");
    } finally { setSubmitting(false); }
  }

  if (loading || authLoading) {
    return (
      <Wrap>
        <div className="flex flex-col items-center pt-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Wrap>
    );
  }

  if (!summary) {
    return (
      <Wrap>
        <div className="flex flex-col items-center pt-20 text-center px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mt-6 text-[24px] font-bold tracking-tight">Invite not found</h1>
          <p className="mt-2 max-w-[280px] text-[13px] text-muted-foreground text-balance">
            This claim link is invalid or has expired. Ask the sender to resend it.
          </p>
          <Button asChild className="mt-8 w-full max-w-sm h-[54px] rounded-2xl text-[17px] font-semibold">
            <Link to="/welcome">Open LockPay</Link>
          </Button>
        </div>
      </Wrap>
    );
  }

  const expired = summary.status === "expired" || new Date(summary.expires_at) < new Date();

  // Logged-out: show summary + CTA to sign in / sign up (channel-aware)
  if (!user) {
    return (
      <Wrap>
        <Header />
        <div className="px-5 mt-4 animate-fade-in">
          <SummaryCard s={summary} />
          <p className="mt-5 px-1 text-[13px] text-muted-foreground text-balance">
            Sign in or create your free LockPay account to verify your identity and confirm this transfer.
          </p>
          <div className="mt-6 space-y-2">
            <Button asChild className="w-full h-[54px] rounded-2xl text-[17px] font-semibold shadow-elevated">
              <Link to={`/signup?next=/claim/${token}`}>Create account</Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-12 rounded-2xl text-[15px] font-semibold bg-card">
              <Link to={`/login?next=/claim/${token}`}>I already have an account</Link>
            </Button>
          </div>
          <TrustList />
        </div>
      </Wrap>
    );
  }

  if (confirmed) {
    return (
      <Wrap>
        <Header />
        <div className="flex flex-col items-center px-6 pt-10 text-center animate-fade-in">
          <SuccessMark size={104} />
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">Recipient confirmed</p>
          <h1 className="mt-1.5 text-[26px] font-bold tracking-tight">You're all set</h1>
          <p className="mt-2 max-w-[300px] text-[13px] text-muted-foreground text-balance">
            <span className="font-semibold text-foreground">{summary.sender_display_name}</span> will complete the payment shortly. We'll notify you when the transfer settles.
          </p>
          <div className="mt-7 w-full max-w-sm">
            <SummaryCard s={{ ...summary, status: summary.status === "pending_invite" ? "recipient_confirmed" : summary.status }} />
          </div>
          <Button asChild className="mt-7 w-full max-w-sm h-[54px] rounded-2xl text-[17px] font-semibold">
            <Link to="/transactions">View activity</Link>
          </Button>
        </div>
      </Wrap>
    );
  }

  if (expired) {
    return (
      <Wrap>
        <Header />
        <div className="flex flex-col items-center px-6 pt-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mt-6 text-[24px] font-bold tracking-tight">Invite expired</h1>
          <p className="mt-2 max-w-[280px] text-[13px] text-muted-foreground text-balance">
            This transfer request has expired. Ask the sender to send a new invite.
          </p>
        </div>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <Header />
      <div className="px-5 mt-4 animate-fade-in">
        <SummaryCard s={summary} />

        <div className="mt-7">
          <h2 className="text-center text-[17px] font-bold tracking-tight">Enter the 4-digit code</h2>
          <p className="mt-1 text-center text-[12px] text-muted-foreground">
            Shared with you privately by the sender
          </p>
          <div className="mt-6">
            <CodeInput value={code} onChange={setCode} masked={false} autoFocus />
          </div>
        </div>

        <div className="sticky bottom-0 z-20 mt-8 -mx-5 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4 bg-gradient-to-t from-surface via-surface/95 to-transparent">
          <Button
            onClick={handleConfirm}
            disabled={submitting || code.length !== 4}
            className="w-full h-[54px] rounded-2xl text-[17px] font-semibold gradient-primary text-primary-foreground shadow-elevated active:scale-[0.98] transition-transform"
          >
            {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
            {submitting ? "Confirming…" : "Confirm transfer"}
          </Button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Lock Pay is not a bank or money transmitter. We coordinate verification only.
          </p>
        </div>
      </div>
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto min-h-screen w-full max-w-md bg-surface pt-safe pb-12">
        {children}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-2 px-5 pt-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-card">
        <Lock className="h-4 w-4 text-primary-foreground" strokeWidth={2.4} />
      </div>
      <span className="text-[17px] font-bold tracking-tight">LockPay</span>
      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-1 text-[10px] font-semibold text-accent-foreground">
        <ShieldCheck className="h-3 w-3" />
        Secure transfer
      </span>
    </div>
  );
}

function SummaryCard({ s }: { s: ClaimSummary }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Incoming transfer</p>
      <p className="mt-2 text-[15px] text-muted-foreground">
        From <span className="font-semibold text-foreground">{s.sender_display_name}</span>
      </p>
      <div className="mt-3 text-[40px] font-bold tabular-nums tracking-tight leading-none">
        ${Number(s.amount).toFixed(2)}
      </div>
      {s.note && (
        <p className="mt-3 rounded-xl bg-secondary/60 px-3 py-2 text-[13px] text-foreground">"{s.note}"</p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <StatusBadge status={s.status} />
        <span className="text-[11px] text-muted-foreground">
          Expires {formatDistanceToNow(new Date(s.expires_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

function TrustList() {
  const items = [
    { icon: ShieldCheck, title: "Verify before you send", text: "Both sides confirm the same 4-digit code." },
    { icon: Lock, title: "End-to-end encrypted", text: "Identity-confirmed transactions only." },
    { icon: ArrowRight, title: "Auto-cancel in 48h", text: "If not confirmed, the request goes away." },
  ];
  return (
    <div className="mt-7 divide-y divide-border/60 rounded-3xl bg-card shadow-card">
      {items.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
            <Icon className="h-4 w-4 text-accent-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold leading-tight">{title}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground leading-snug">{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
