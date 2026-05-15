import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Lock, ArrowDownLeft, ArrowUpRight, Plus, Send as SendIcon,
  Clock, CheckCircle2, AlertCircle, ChevronRight, CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { haptic } from "@/lib/native";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Status = Database["public"]["Enums"]["transaction_status"];
interface Tx {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  amount: number;
  status: Status;
  recipient_identifier: string;
  recipient_channel: string | null;
  created_at: string;
  sender_paypal_email: string | null;
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "awaiting_recipient", label: "Awaiting" },
  { id: "completed", label: "Completed" },
  { id: "expired", label: "Expired" },
] as const;
type FilterId = typeof FILTERS[number]["id"];

const ACTIVE_STATES: Status[] = [
  "pending_invite", "awaiting_recipient", "recipient_confirmed",
  "pending_payment", "locked", "awaiting_confirmation",
];

export default function Transactions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initial = (params.get("filter") as FilterId) || "all";
  const [filter, setFilter] = useState<FilterId>(initial);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTxs = useCallback(async () => {
    const { data } = await supabase
      .from("transactions")
      .select("id,sender_id,recipient_id,amount,status,recipient_identifier,recipient_channel,created_at,sender_paypal_email")
      .order("created_at", { ascending: false });
    setTxs((data as Tx[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchTxs();
    const channel = supabase.channel("activity-tx")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => fetchTxs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchTxs]);

  const filtered = txs.filter((t) => {
    if (filter === "all") return true;
    if (filter === "active") return ACTIVE_STATES.includes(t.status);
    if (filter === "awaiting_recipient")
      return t.status === "pending_invite" || t.status === "awaiting_recipient";
    if (filter === "completed") return t.status === "completed" || t.status === "unlocked";
    if (filter === "expired")
      return t.status === "expired" || t.status === "cancelled" || t.status === "refunded";
    return true;
  });

  return (
    <AppShell>
      <div className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-3">
        <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">All your transfers — pending, locked, and completed.</p>
      </div>

      <div className="sticky top-0 z-10 -mt-1 bg-surface/85 px-5 pb-3 pt-2 backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setParams(f.id === "all" ? {} : { filter: f.id }); }}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all active:scale-95",
                filter === f.id
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "bg-card text-muted-foreground border border-border"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5">
        {loading ? (
          <ul className="space-y-2 stagger">
            {[1, 2, 3, 4].map((i) => (
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
          <EmptyState filter={filter} />
        ) : (
          <ul className="space-y-2">
            {filtered.map((t) => (
              <TxRow key={t.id} tx={t} userId={user!.id} onAction={fetchTxs} navigate={navigate} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState({ filter }: { filter: FilterId }) {
  const labels: Record<FilterId, { title: string; sub: string }> = {
    all: { title: "No transfers yet", sub: "Your activity will appear here once you send or receive a payment." },
    active: { title: "Nothing in flight", sub: "Pending and locked transfers show up here." },
    awaiting_recipient: { title: "No invites awaiting", sub: "Invited recipients show up here until they confirm." },
    completed: { title: "No completed transfers", sub: "Released and finalized transfers will appear here." },
    expired: { title: "No expired transfers", sub: "Expired, cancelled, and refunded transfers appear here." },
  };
  const { title, sub } = labels[filter];
  return (
    <div className="rounded-3xl bg-card p-8 text-center shadow-card animate-slide-up">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft">
        <Lock className="h-6 w-6 text-accent-foreground" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      <Button asChild className="mt-4 rounded-xl">
        <Link to="/send"><Plus className="mr-1 h-4 w-4" /> New transfer</Link>
      </Button>
    </div>
  );
}

function TxRow({
  tx, userId, onAction, navigate,
}: {
  tx: Tx; userId: string; onAction: () => void;
  navigate: (path: string) => void;
}) {
  const out = tx.sender_id === userId;
  const Icon = out ? ArrowUpRight : ArrowDownLeft;
  const action = getRowAction(tx, out);

  const handleClick = () => {
    if (action?.kind === "complete_payment") {
      // Sender needs to pay — navigate to a dedicated checkout context via SendMoney isn't ideal;
      // simplest: bounce them through /unlock/:id which surfaces a Pay CTA.
      navigate(`/unlock/${tx.id}`);
      return;
    }
    navigate(`/unlock/${tx.id}`);
  };

  const handleAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!action) return;
    if (action.kind === "complete_payment" || action.kind === "open_unlock" || action.kind === "claim") {
      navigate(action.href);
      return;
    }
    if (action.kind === "resend_invite") {
      try {
        await supabase.functions.invoke("send-transfer-invite", { body: { transactionId: tx.id } });
        toast.success("Invite resent");
        onAction();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not resend");
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-transform active:scale-[0.98] text-left"
    >
      <div className={cn(
        "flex h-11 w-11 items-center justify-center rounded-xl shrink-0",
        out ? "bg-secondary text-secondary-foreground" : "bg-accent-soft text-accent-foreground"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">
            {out ? `To ${tx.recipient_identifier}` : `From ${tx.sender_paypal_email ?? "sender"}`}
          </p>
          <span className="text-sm font-bold tabular-nums shrink-0">
            {out ? "−" : "+"}${Number(tx.amount).toFixed(2)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <StatusBadge status={tx.status} />
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
          </span>
        </div>
        {action && (
          <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-accent-soft/60 px-3 py-2">
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-accent-foreground min-w-0">
              <action.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{action.label}</span>
            </span>
            <span
              role="button"
              onClick={handleAction}
              className="flex items-center gap-1 rounded-full bg-card px-3 py-1 text-[11px] font-semibold text-foreground shadow-sm shrink-0"
            >
              {action.cta} <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

type RowAction = {
  kind: "complete_payment" | "open_unlock" | "claim" | "resend_invite";
  label: string;
  cta: string;
  icon: typeof Lock;
  href: string;
};

function getRowAction(tx: Tx, isSender: boolean): RowAction | null {
  if (isSender) {
    if (tx.status === "recipient_confirmed") {
      return {
        kind: "complete_payment",
        label: "Recipient confirmed",
        cta: "Pay now",
        icon: CreditCard,
        href: `/unlock/${tx.id}`,
      };
    }
    if (tx.status === "pending_invite" || tx.status === "awaiting_recipient") {
      return {
        kind: "resend_invite",
        label: "Awaiting recipient",
        cta: "Resend",
        icon: SendIcon,
        href: `/unlock/${tx.id}`,
      };
    }
    if (tx.status === "locked" || tx.status === "awaiting_confirmation") {
      return {
        kind: "open_unlock",
        label: "Confirm with code",
        cta: "Open",
        icon: Lock,
        href: `/unlock/${tx.id}`,
      };
    }
  } else {
    if (tx.status === "locked" || tx.status === "awaiting_confirmation") {
      return {
        kind: "open_unlock",
        label: "Action needed",
        cta: "Confirm",
        icon: CheckCircle2,
        href: `/unlock/${tx.id}`,
      };
    }
  }
  return null;
}
