import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lock, ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type Status = "locked" | "awaiting_confirmation" | "completed" | "expired" | "cancelled";
interface Tx {
  id: string; sender_id: string; amount: number; status: Status;
  recipient_identifier: string; created_at: string;
  sender_paypal_email: string | null;
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "locked", label: "Locked" },
  { id: "completed", label: "Completed" },
  { id: "expired", label: "Expired" },
] as const;
type FilterId = typeof FILTERS[number]["id"];

export default function Transactions() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const initial = (params.get("filter") as FilterId) || "all";
  const [filter, setFilter] = useState<FilterId>(initial);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase.from("transactions").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setTxs((data as Tx[]) ?? []); setLoading(false); });
  }, [user]);

  const filtered = txs.filter((t) => {
    if (filter === "all") return true;
    if (filter === "locked") return t.status === "locked" || t.status === "awaiting_confirmation";
    return t.status === filter;
  });

  return (
    <AppShell>
      <div className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-3">
        <h1 className="text-2xl font-bold tracking-tight">Vault</h1>
        <p className="mt-1 text-sm text-muted-foreground">All your locked &amp; released transfers.</p>
      </div>

      <div className="sticky top-0 z-10 -mt-1 bg-surface/85 px-5 pb-3 pt-2 backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {FILTERS.map((f) => (
            <button key={f.id}
              onClick={() => { setFilter(f.id); setParams(f.id === "all" ? {} : { filter: f.id }); }}
              className={cn("whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all active:scale-95",
                filter === f.id ? "bg-primary text-primary-foreground shadow-card" : "bg-card text-muted-foreground border border-border")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5">
        {loading ? (
          <ul className="space-y-2 stagger">
            {[1,2,3,4].map((i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
                <div className="h-11 w-11 shrink-0 rounded-xl skeleton-shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 rounded-full skeleton-shimmer" />
                  <div className="h-3 w-1/3 rounded-full skeleton-shimmer" />
                </div>
              </li>
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-card p-8 text-center shadow-card animate-slide-up">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft">
              <Lock className="h-6 w-6 text-accent-foreground" />
            </div>
            <p className="text-sm font-semibold">No {filter !== "all" ? filter : ""} transfers yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Your activity will appear here once you send or receive a payment.</p>
            <Button asChild className="mt-4 rounded-xl"><Link to="/send"><Plus className="mr-1 h-4 w-4" /> New transfer</Link></Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((t) => {
              const out = t.sender_id === user?.id;
              const Icon = out ? ArrowUpRight : ArrowDownLeft;
              return (
                <Link key={t.id} to={`/unlock/${t.id}`} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-transform active:scale-[0.98]">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl",
                    out ? "bg-secondary text-secondary-foreground" : "bg-accent-soft text-accent-foreground")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-semibold">
                        {out ? `To ${t.recipient_identifier}` : `From ${t.sender_paypal_email ?? "sender"}`}
                      </p>
                      <span className="text-sm font-bold tabular-nums">{out ? "−" : "+"}${Number(t.amount).toFixed(2)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <StatusBadge status={t.status} />
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
