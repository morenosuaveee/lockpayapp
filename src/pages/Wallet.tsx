import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Banknote, CheckCircle2, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { LegalFooter } from "@/components/layout/LegalFooter";
import { format } from "date-fns";

interface LedgerEntry {
  id: string;
  kind: string;
  amount: number;
  description: string | null;
  created_at: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  failure_reason: string | null;
}

interface PayoutStatus {
  connected: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

const safeDate = (v: string | null) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : format(d, "MMM d, h:mm a");
};

export default function WalletPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [payout, setPayout] = useState<PayoutStatus | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState<"connect" | "withdraw" | "dashboard" | null>(null);

  const balance = entries.reduce((s, e) => s + Number(e.amount), 0);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: led }, { data: wds }] = await Promise.all([
      supabase.from("wallet_ledger").select("id,kind,amount,description,created_at").order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("id,amount,status,created_at,failure_reason").order("created_at", { ascending: false }).limit(10),
    ]);
    setEntries((led as LedgerEntry[]) ?? []);
    setWithdrawals((wds as Withdrawal[]) ?? []);
    setLoading(false);

    const { data: status, error } = await supabase.functions.invoke("payout-account", { body: { action: "status" } });
    if (!error && status) setPayout(status as PayoutStatus);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const connect = async () => {
    setBusy("connect");
    const { data, error } = await supabase.functions.invoke("payout-account", {
      body: { action: "onboard", returnUrl: `${window.location.origin}/wallet` },
    });
    setBusy(null);
    if (error || !data?.url) {
      toast.error(data?.error ?? error?.message ?? "Could not start payout setup");
      return;
    }
    window.location.href = data.url as string;
  };

  const openDashboard = async () => {
    setBusy("dashboard");
    const { data, error } = await supabase.functions.invoke("payout-account", { body: { action: "dashboard" } });
    setBusy(null);
    if (error || !data?.url) {
      toast.error(data?.error ?? error?.message ?? "Could not open your payout account");
      return;
    }
    window.open(data.url as string, "_blank", "noopener");
  };

  const withdraw = async () => {
    const value = Number(amount);
    if (!(value > 0)) return toast.error("Enter an amount to withdraw");
    if (value > balance) return toast.error("Amount exceeds your available balance");
    setBusy("withdraw");
    const { data, error } = await supabase.functions.invoke("request-withdrawal", { body: { amount: value } });
    setBusy(null);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "Withdrawal failed");
      return;
    }
    toast.success(`$${value.toFixed(2)} on its way to your bank`);
    setAmount("");
    load();
  };

  const canWithdraw = !!payout?.payoutsEnabled && balance > 0;

  return (
    <AppShell>
      <div className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card active:scale-[0.94] transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Your balance</h1>
        </div>

        {/* Balance card */}
        <div className="mt-5 overflow-hidden rounded-3xl gradient-balance p-6 text-primary-foreground shadow-elevated">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
            <Banknote className="h-3.5 w-3.5" />
            Available in LockPay
          </div>
          <div className="mt-2 text-4xl font-bold tabular-nums">
            {loading ? "—" : `$${balance.toFixed(2)}`}
          </div>
          <p className="mt-1 text-xs opacity-75">
            Unlocked transfers land here instantly. Withdraw to your bank whenever you like.
          </p>
        </div>

        {/* Payout account */}
        <div className="mt-4 rounded-3xl bg-card p-5 shadow-card">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
              <ShieldCheck className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Payout account</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {payout?.payoutsEnabled
                  ? "Verified — withdrawals go straight to your bank."
                  : payout?.connected
                    ? "Finish verification to enable withdrawals."
                    : "Sign in with Stripe or Link to add your bank details."}
              </p>
            </div>
            {payout?.payoutsEnabled && <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />}
          </div>

          <div className="mt-4 flex gap-2">
            {!payout?.payoutsEnabled && (
              <Button onClick={connect} disabled={busy === "connect"} className="h-12 flex-1 rounded-2xl font-semibold">
                {busy === "connect" ? <Loader2 className="h-4 w-4 animate-spin" /> : payout?.connected ? "Continue verification" : "Connect payout account"}
              </Button>
            )}
            {payout?.connected && (
              <Button
                variant="outline"
                onClick={openDashboard}
                disabled={busy === "dashboard"}
                className="h-12 flex-1 rounded-2xl bg-card font-semibold"
              >
                {busy === "dashboard" ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><ExternalLink className="mr-1.5 h-4 w-4" /> Manage account</>)}
              </Button>
            )}
          </div>
        </div>

        {/* Withdraw */}
        <div className="mt-4 rounded-3xl bg-card p-5 shadow-card">
          <p className="text-sm font-semibold">Withdraw</p>
          <div className="mt-3 flex items-baseline gap-1 rounded-2xl bg-secondary px-4 py-3">
            <span className="text-3xl font-bold tabular-nums text-muted-foreground">$</span>
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, "").slice(0, 8))}
              aria-label="Withdrawal amount"
              className="w-full min-w-0 bg-transparent text-3xl font-bold tabular-nums outline-none"
            />
            <button
              type="button"
              onClick={() => setAmount(balance.toFixed(2))}
              className="shrink-0 rounded-full bg-card px-3 py-1 text-[11px] font-bold shadow-sm"
            >
              Max
            </button>
          </div>
          <Button
            onClick={withdraw}
            disabled={!canWithdraw || busy === "withdraw"}
            className="mt-3 h-13 w-full rounded-2xl py-3.5 text-base font-semibold shadow-card"
          >
            {busy === "withdraw" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw to bank"}
          </Button>
          {!payout?.payoutsEnabled && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Connect and verify a payout account to withdraw.
            </p>
          )}
        </div>

        {/* Activity */}
        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold">Balance activity</h2>
          {loading ? (
            <ul className="space-y-2">
              {[1, 2, 3].map((i) => (
                <li key={i} className="h-16 rounded-2xl skeleton-shimmer" />
              ))}
            </ul>
          ) : entries.length === 0 ? (
            <div className="rounded-3xl bg-card p-8 text-center shadow-card">
              <p className="text-sm font-medium">No balance activity yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                When a transfer is unlocked, the money shows up here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {entries.map((e) => {
                const credit = Number(e.amount) >= 0;
                return (
                  <li key={e.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${credit ? "bg-accent-soft text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                      <ArrowUpRight className={`h-5 w-5 ${credit ? "rotate-180" : ""}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.description ?? (credit ? "Credit" : "Withdrawal")}</p>
                      <p className="text-xs text-muted-foreground">{safeDate(e.created_at)}</p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold tabular-nums ${credit ? "text-accent" : "text-foreground"}`}>
                      {credit ? "+" : "−"}${Math.abs(Number(e.amount)).toFixed(2)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {withdrawals.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-base font-semibold">Withdrawals</h2>
            <ul className="space-y-2">
              {withdrawals.map((w) => (
                <li key={w.id} className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card">
                  <div className="min-w-0">
                    <p className="text-sm font-medium tabular-nums">${Number(w.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{safeDate(w.created_at)}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold capitalize text-muted-foreground">
                    {w.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <LegalFooter />
    </AppShell>
  );
}
