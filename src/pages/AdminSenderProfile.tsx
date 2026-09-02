import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Flag,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  UserCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { FlagActivityDialog } from "@/components/admin/FlagActivityDialog";
import { Button } from "@/components/ui/button";
import { calcAge } from "@/lib/age";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type TxnStatus = Database["public"]["Enums"]["transaction_status"];

type SenderProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  onboarding_completed_at: string | null;
  identity_status: string | null;
  is_admin: boolean;
};

type Totals = {
  sent_count: number;
  sent_amount: number;
  unlocked_count: number;
  unlocked_amount: number;
  in_flight_amount: number;
  refunded_amount: number;
  fees_amount: number;
  claims_count: number;
  invites_count: number;
  distinct_recipients: number;
  failed_unlock_attempts: number;
  first_sent_at: string | null;
  last_sent_at: string | null;
};

type Summary = { profile: SenderProfile | null; totals: Totals | null; open_flags: number };

type Transfer = {
  id: string;
  amount: number;
  fee_amount: number;
  currency: string;
  status: TxnStatus;
  recipient_identifier: string;
  recipient_channel: string | null;
  recipient_id: string | null;
  recipient_name: string | null;
  recipient_claimed: boolean;
  recipient_confirmed_at: string | null;
  invite_sent_at: string | null;
  released_at: string | null;
  expires_at: string | null;
  created_at: string;
  failed_attempts: number;
  flag_count: number;
};

type FlagRow = {
  id: string;
  transaction_id: string | null;
  reason: string;
  severity: string;
  notes: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  created_by_name: string | null;
};

const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(n) || 0);

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const severityTone: Record<string, string> = {
  high: "bg-destructive-soft text-destructive",
  medium: "bg-lock-soft text-lock-foreground",
  low: "bg-secondary text-muted-foreground",
};

export default function AdminSenderProfile() {
  const { id = "" } = useParams();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [s, t, f] = await Promise.all([
      supabase.rpc("admin_sender_summary", { _user_id: id }),
      supabase.rpc("admin_sender_transfers", { _user_id: id, _limit: 200 }),
      supabase.rpc("admin_sender_flags", { _user_id: id }),
    ]);
    setLoading(false);
    const err = s.error ?? t.error ?? f.error;
    if (err) {
      toast.error(err.message);
      return;
    }
    setSummary(s.data as unknown as Summary);
    setTransfers((t.data ?? []) as unknown as Transfer[]);
    setFlags((f.data ?? []) as unknown as FlagRow[]);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setFlagStatus(flagId: string, status: "resolved" | "dismissed") {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("activity_flags")
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: auth.user?.id ?? null,
      })
      .eq("id", flagId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "resolved" ? "Flag resolved" : "Flag dismissed");
    void load();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const p = summary?.profile;
  const totals = summary?.totals;

  if (!p) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Sender not found.</p>
        <Link to="/admin/users" className="text-sm font-semibold text-primary">
          Back to directory
        </Link>
      </div>
    );
  }

  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.display_name || "Unnamed";
  const age = calcAge(p.date_of_birth);
  const openFlags = flags.filter((f) => f.status === "open");

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 px-5 pb-4 pt-[max(env(safe-area-inset-top),1rem)] backdrop-blur">
        <Link
          to="/admin/users"
          className="-ml-1 inline-flex h-9 items-center gap-1 rounded-full px-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Directory
        </Link>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 truncate text-2xl font-bold tracking-tight">
              {name}
              {p.is_admin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-lock-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-2.5 w-2.5" /> Admin
                </span>
              )}
            </h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{p.email ?? "—"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {p.phone_number ?? "No phone"}
              {age !== null && <span> · {age} yrs</span>} · Joined {fmtDate(p.created_at)}
            </p>
          </div>
          <FlagActivityDialog userId={p.id} size="sm" onFlagged={load} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10.5px]">
          <Chip on={p.email_verified} label="Email" />
          <Chip on={p.phone_verified} label="Phone" />
          <Chip on={p.identity_status === "verified"} label="Identity" />
          <Chip on={!!p.onboarding_completed_at} label="Onboarded" />
          {openFlags.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive-soft px-1.5 py-0.5 font-semibold text-destructive">
              <Flag className="h-2.5 w-2.5" /> {openFlags.length} open flag
              {openFlags.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </header>

      <main className="space-y-6 px-5 py-5">
        <section>
          <p className="eyebrow">Transfer totals</p>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Sent" value={money(totals?.sent_amount ?? 0)} sub={`${totals?.sent_count ?? 0} transfers`} />
            <Stat
              label="Unlocked by recipients"
              value={money(totals?.unlocked_amount ?? 0)}
              sub={`${totals?.unlocked_count ?? 0} unlocked`}
              icon={<Unlock className="h-3.5 w-3.5" />}
            />
            <Stat label="In flight" value={money(totals?.in_flight_amount ?? 0)} sub="Locked or clearing" />
            <Stat
              label="Refunded / expired"
              value={money(totals?.refunded_amount ?? 0)}
              sub={`Fees ${money(totals?.fees_amount ?? 0)}`}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat
              label="Recipient claims"
              value={String(totals?.claims_count ?? 0)}
              sub={`${totals?.invites_count ?? 0} invites sent`}
              icon={<UserCheck className="h-3.5 w-3.5" />}
            />
            <Stat
              label="Failed unlock attempts"
              value={String(totals?.failed_unlock_attempts ?? 0)}
              sub={`${totals?.distinct_recipients ?? 0} distinct recipients`}
              tone={(totals?.failed_unlock_attempts ?? 0) > 3 ? "warn" : undefined}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            First transfer {fmtDate(totals?.first_sent_at)} · Latest {fmtDate(totals?.last_sent_at)}
          </p>
        </section>

        <section>
          <p className="eyebrow">Flags ({flags.length})</p>
          {flags.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              No flags on this sender.
            </div>
          ) : (
            <ul className="space-y-3">
              {flags.map((f) => (
                <li key={f.id} className="rounded-3xl bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{f.reason}</p>
                      {f.notes && <p className="mt-0.5 text-xs text-muted-foreground">{f.notes}</p>}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {f.created_by_name ?? "Administrator"} · {fmtDate(f.created_at)}
                        {f.transaction_id && (
                          <> · transfer {f.transaction_id.slice(0, 8)}</>
                        )}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        severityTone[f.severity] ?? severityTone.low
                      }`}
                    >
                      {f.severity}
                    </span>
                  </div>
                  {f.status === "open" ? (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => void setFlagStatus(f.id, "resolved")}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl text-muted-foreground"
                        onClick={() => void setFlagStatus(f.id, "dismissed")}
                      >
                        Dismiss
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {f.status} {f.resolved_at ? `· ${fmtDate(f.resolved_at)}` : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <p className="eyebrow">Sent transfers ({transfers.length})</p>
          {transfers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              This user has not sent any transfers.
            </div>
          ) : (
            <ul className="space-y-3">
              {transfers.map((t) => (
                <li key={t.id} className="rounded-3xl bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-bold tabular-nums">{money(t.amount, t.currency)}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        To {t.recipient_name ?? t.recipient_identifier}
                        {t.recipient_channel ? ` · ${t.recipient_channel}` : ""}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Created {fmtDate(t.created_at)}
                        {t.released_at && <> · unlocked {fmtDate(t.released_at)}</>}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10.5px]">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium ${
                        t.recipient_claimed
                          ? "bg-accent-soft text-accent-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <UserCheck className="h-2.5 w-2.5" />
                      {t.recipient_claimed
                        ? `Claimed ${fmtDate(t.recipient_confirmed_at)}`
                        : "Not claimed"}
                    </span>
                    {t.failed_attempts > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive-soft px-1.5 py-0.5 font-medium text-destructive">
                        {t.failed_attempts} failed code {t.failed_attempts === 1 ? "try" : "tries"}
                      </span>
                    )}
                    {t.flag_count > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive-soft px-1.5 py-0.5 font-semibold text-destructive">
                        <Flag className="h-2.5 w-2.5" /> Flagged
                      </span>
                    )}
                    <span className="ml-auto">
                      <FlagActivityDialog
                        userId={p.id}
                        transactionId={t.id}
                        label="Flag"
                        size="sm"
                        onFlagged={load}
                      />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-center text-[11px] text-muted-foreground">
          Administrator view. Personal and transfer data must be handled per the LockPay Privacy
          Policy.
        </p>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  tone?: "warn";
}) {
  return (
    <div className="rounded-2xl bg-card p-3.5 shadow-card">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-bold tabular-nums ${
          tone === "warn" ? "text-destructive" : ""
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[10.5px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Chip({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium ${
        on ? "bg-accent-soft text-accent-foreground" : "bg-secondary text-muted-foreground"
      }`}
    >
      <BadgeCheck className={`h-2.5 w-2.5 ${on ? "" : "opacity-40"}`} />
      {label}
    </span>
  );
}
