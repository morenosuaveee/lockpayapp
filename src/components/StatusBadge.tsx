import { Lock, CheckCircle2, Clock, XCircle, AlertCircle, Unlock, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["transaction_status"];

const config: Record<Status, { label: string; icon: typeof Lock; className: string }> = {
  pending_payment: { label: "Awaiting payment", icon: Clock, className: "bg-muted text-muted-foreground" },
  locked: { label: "Locked", icon: Lock, className: "bg-lock-soft text-lock-foreground" },
  awaiting_confirmation: { label: "Awaiting confirmation", icon: AlertCircle, className: "bg-lock-soft text-lock-foreground" },
  completed: { label: "Released", icon: CheckCircle2, className: "bg-accent-soft text-accent-foreground" },
  expired: { label: "Expired", icon: Clock, className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-destructive-soft text-destructive" },
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
