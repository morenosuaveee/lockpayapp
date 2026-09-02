import { Lock, CheckCircle2, Clock, XCircle, AlertCircle, Unlock, Undo2, Send, UserCheck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["transaction_status"];

const config: Record<Status, { label: string; icon: typeof Lock; className: string }> = {
  pending_invite: { label: "Invite sent", icon: Send, className: "bg-muted text-muted-foreground" },
  awaiting_recipient: { label: "Awaiting recipient", icon: Clock, className: "bg-lock-soft text-lock-foreground" },
  recipient_confirmed: { label: "Recipient confirmed", icon: UserCheck, className: "bg-accent-soft text-accent-foreground" },
  pending_payment: { label: "Awaiting payment", icon: Clock, className: "bg-muted text-muted-foreground" },
  locked: { label: "Locked", icon: Lock, className: "bg-lock-soft text-lock-foreground" },
  awaiting_confirmation: { label: "Awaiting confirmation", icon: ShieldCheck, className: "bg-lock-soft text-lock-foreground" },
  completed: { label: "Completed", icon: CheckCircle2, className: "bg-accent-soft text-accent-foreground" },
  expired: { label: "Expired", icon: Clock, className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-destructive-soft text-destructive" },
  pending: { label: "Bank payment clearing", icon: Clock, className: "bg-muted text-muted-foreground" },
  unlocked: { label: "Unlocked", icon: Unlock, className: "bg-accent-soft text-accent-foreground" },
  refunded: { label: "Refunded", icon: Undo2, className: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", c.className, className)}>
      <Icon className="h-3.5 w-3.5" />
      {c.label}
    </span>
  );
}
