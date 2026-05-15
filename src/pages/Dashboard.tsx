import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, ArrowDownLeft, ArrowUpRight, Lock as LockIcon, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationsBell, type NotifTx } from "@/components/NotificationsBell";
import { TrustStrip } from "@/components/TrustStrip";
import { LegalFooter } from "@/components/layout/LegalFooter";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Tx extends NotifTx {
  note: string | null;
}

interface Profile { display_name: string | null; paypal_email: string | null; }

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      const [{ data: prof }, { data: list }] = await Promise.all([
        supabase.from("profiles").select("display_name,paypal_email,phone_verified_at").eq("id", user.id).maybeSingle(),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(8),
      ]);
      if (!mounted) return;
      const onboarded =
        localStorage.getItem(`lp_onboarded_${user.id}`) === "1" ||
        !!(prof as { phone_verified_at?: string | null } | null)?.phone_verified_at;
      if (!onboarded) {
        navigate("/onboarding", { replace: true });
        return;
      }
      setProfile(prof);
      setTxs((list as Tx[]) ?? []);
      setLoading(false);
    })();

    const channel = supabase.channel("dashboard-tx")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(8)
          .then(({ data }) => setTxs((data as Tx[]) ?? []));
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [user, navigate]);

  const lockedAmount = txs.filter((t) => t.status === "locked" || t.status === "awaiting_confirmation")
    .filter((t) => t.sender_id === user?.id).reduce((s, t) => s + Number(t.amount), 0);

  const actionableTxs = txs.filter(
    (t) => t.sender_id === user?.id && t.status === "recipient_confirmed"
  );

  return (
    <AppShell>
      <div className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-2xl font-bold tracking-tight">{profile?.display_name ?? "Friend"}</h1>
          </div>
          <div className="flex items-center gap-2">
            {user && <NotificationsBell txs={txs} userId={user.id} />}
            <button
              onClick={() => navigate("/profile")}
              aria-label="Open profile"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold transition-transform active:scale-[0.94]"
            >
              {(profile?.display_name?.[0] ?? "?").toUpperCase()}
            </button>
          </div>
        </div>

        {/* Balance card */}
        <div className="mt-6 overflow-hidden rounded-3xl gradient-balance p-6 text-primary-foreground shadow-elevated">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
            <Wallet className="h-3.5 w-3.5" />
            Available balance
          </div>
          <div className="mt-2 text-4xl font-bold tabular-nums">$2,480.<span className="text-2xl opacity-70">00</span></div>
          <div className="mt-1 text-xs opacity-70">{profile?.paypal_email ?? "Link your PayPal"}</div>

          {lockedAmount > 0 && (
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lock/30">
                  <LockIcon className="h-4 w-4 text-lock" />
                </div>
                <div>
                  <div className="text-xs opacity-80">Funds locked</div>
                  <div className="text-sm font-semibold tabular-nums">${lockedAmount.toFixed(2)}</div>
                </div>
              </div>
              <Link to="/transactions?filter=locked" className="text-xs font-medium opacity-90 hover:opacity-100">View →</Link>
            </div>
          )}
        </div>

        {/* Action needed: recipient confirmed, awaiting sender payment */}
        {actionableTxs.length > 0 && (
          <div className="mt-4 space-y-2 animate-fade-in">
            {actionableTxs.slice(0, 2).map((t) => (
              <Link
                key={t.id}
                to={`/unlock/${t.id}`}
                className="flex items-center gap-3 rounded-2xl bg-accent-soft p-3.5 shadow-card active:scale-[0.99] transition-transform"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-accent-foreground">Recipient confirmed</p>
                  <p className="truncate text-[11px] text-accent-foreground/80">
                    Pay ${Number(t.amount).toFixed(2)} to {t.recipient_identifier}
                  </p>
                </div>
                <span className="rounded-full bg-card px-3 py-1 text-[11px] font-bold text-foreground shadow-sm">
                  Pay
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button asChild className="h-14 rounded-2xl text-base font-semibold shadow-card">
            <Link to="/send"><Plus className="mr-1 h-5 w-5" /> Send</Link>
          </Button>
          <Button asChild variant="outline" className="h-14 rounded-2xl text-base font-semibold bg-card">
            <Link to="/transactions"><LockIcon className="mr-1 h-5 w-5" /> Activity</Link>
          </Button>
        </div>

        {/* Trust strip */}
        <TrustStrip className="mt-5" />
      </div>

      {/* Recent transactions */}
      <section className="px-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent activity</h2>
          <Link to="/transactions" className="text-sm font-medium text-accent">See all</Link>
        </div>

        {loading ? (
          <ul className="space-y-2 stagger">
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
                <div className="h-11 w-11 shrink-0 rounded-xl skeleton-shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 rounded-full skeleton-shimmer" />
                  <div className="h-3 w-1/3 rounded-full skeleton-shimmer" />
                </div>
              </li>
            ))}
          </ul>
        ) : txs.length === 0 ? (
          <div className="rounded-3xl bg-card p-8 text-center shadow-card">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft">
              <LockIcon className="h-6 w-6 text-accent-foreground" />
            </div>
            <p className="text-sm font-medium">No transfers yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Create your first conditional transfer.</p>
            <Button asChild className="mt-4 rounded-xl"><Link to="/send">Send money</Link></Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {txs.map((t) => <TxRow key={t.id} tx={t} userId={user!.id} />)}
          </ul>
        )}
      </section>
      <LegalFooter />
    </AppShell>
  );
}

function TxRow({ tx, userId }: { tx: Tx; userId: string }) {
  const isOutgoing = tx.sender_id === userId;
  const Icon = isOutgoing ? ArrowUpRight : ArrowDownLeft;
  return (
    <Link
      to={`/unlock/${tx.id}`}
      className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-transform active:scale-[0.98]"
    >
      <div className={cn(
        "flex h-11 w-11 items-center justify-center rounded-xl",
        isOutgoing ? "bg-secondary text-secondary-foreground" : "bg-accent-soft text-accent-foreground"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-semibold">
            {isOutgoing ? `To ${tx.recipient_identifier}` : `From ${tx.sender_paypal_email ?? "sender"}`}
          </p>
          <span className={cn("text-sm font-bold tabular-nums", isOutgoing ? "text-foreground" : "text-accent-foreground")}>
            {isOutgoing ? "−" : "+"}${Number(tx.amount).toFixed(2)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <StatusBadge status={tx.status} />
          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}</span>
        </div>
      </div>
    </Link>
  );
}
