import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bell, ArrowDownLeft, ArrowUpRight, Lock as LockIcon, CheckCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

import type { Database } from "@/integrations/supabase/types";

export interface NotifTx {
  id: string;
  sender_id: string;
  amount: number;
  status: Database["public"]["Enums"]["transaction_status"];
  recipient_identifier: string;
  sender_paypal_email: string | null;
  created_at: string;
  updated_at: string;
  released_at: string | null;
}

export function NotificationsBell({ txs, userId }: { txs: NotifTx[]; userId: string }) {
  const items = useMemo(() => buildNotifications(txs, userId), [txs, userId]);
  const unread = items.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-card transition-transform active:scale-95"
        >
          <Bell className="h-5 w-5 text-foreground" strokeWidth={2.2} />
          {unread > 0 && (
            <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-0 shadow-elevated">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-[11px] text-muted-foreground">Recent activity on your transfers</p>
        </div>
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">You're all caught up</p>
            <p className="mt-0.5 text-xs text-muted-foreground">New activity will appear here.</p>
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  to={`/unlock/${n.txId}`}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      n.tone === "accent" && "bg-accent-soft text-accent-foreground",
                      n.tone === "lock" && "bg-lock-soft text-lock-foreground",
                      n.tone === "primary" && "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {n.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.subtitle}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {formatDistanceToNow(new Date(n.at), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface Notif {
  id: string;
  txId: string;
  title: string;
  subtitle: string;
  at: string;
  tone: "primary" | "accent" | "lock";
  icon: React.ReactNode;
}

function buildNotifications(txs: NotifTx[], userId: string): Notif[] {
  const out: Notif[] = [];
  for (const t of txs) {
    const isOutgoing = t.sender_id === userId;
    const counterparty = isOutgoing ? t.recipient_identifier : (t.sender_paypal_email ?? "sender");
    const amt = `$${Number(t.amount).toFixed(2)}`;
    if (t.status === "completed") {
      out.push({
        id: `${t.id}-done`,
        txId: t.id,
        title: isOutgoing ? `Released ${amt} to ${counterparty}` : `You received ${amt}`,
        subtitle: "Transfer completed",
        at: t.released_at ?? t.updated_at,
        tone: "accent",
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
    } else if (t.status === "locked" || t.status === "awaiting_confirmation") {
      out.push({
        id: `${t.id}-lock`,
        txId: t.id,
        title: isOutgoing
          ? `${amt} locked for ${counterparty}`
          : `${counterparty} sent you ${amt}`,
        subtitle: t.status === "awaiting_confirmation" ? "Waiting for final unlock" : "Awaiting unlock code",
        at: t.updated_at,
        tone: "lock",
        icon: <LockIcon className="h-4 w-4" />,
      });
    } else if (t.status === "expired" || t.status === "cancelled") {
      out.push({
        id: `${t.id}-x`,
        txId: t.id,
        title: `${amt} ${t.status === "expired" ? "expired" : "cancelled"}`,
        subtitle: isOutgoing ? `To ${counterparty}` : `From ${counterparty}`,
        at: t.updated_at,
        tone: "primary",
        icon: isOutgoing ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />,
      });
    }
  }
  return out
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 8);
}
