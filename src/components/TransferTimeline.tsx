import { Check, Clock, Lock, Send, ShieldCheck, UserCheck, XCircle } from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/utils";

interface TimelineTx {
  status: string;
  created_at: string;
  invite_sent_at?: string | null;
  recipient_confirmed_at?: string | null;
  released_at?: string | null;
  expires_at?: string;
}

type StepState = "done" | "current" | "todo" | "failed";

interface Step {
  key: string;
  label: string;
  icon: typeof Lock;
  state: StepState;
  ts?: string | null;
  hint?: string;
}

function buildSteps(tx: TimelineTx): Step[] {
  const s = tx.status;
  const failed = s === "expired" || s === "cancelled" || s === "refunded";
  const done = (cond: boolean): StepState => (cond ? "done" : "todo");

  const inviteSent = !!tx.invite_sent_at || ["awaiting_recipient", "recipient_confirmed", "pending_payment", "locked", "awaiting_confirmation", "unlocked", "completed"].includes(s);
  const recipientConfirmed = !!tx.recipient_confirmed_at || ["recipient_confirmed", "pending_payment", "locked", "awaiting_confirmation", "unlocked", "completed"].includes(s);
  const paid = ["locked", "awaiting_confirmation", "unlocked", "completed"].includes(s);
  const released = ["unlocked", "completed"].includes(s);

  const steps: Step[] = [
    { key: "drafted", label: "Drafted", icon: Send, state: "done", ts: tx.created_at },
    {
      key: "invite",
      label: inviteSent ? "Invite sent" : "Pending recipient",
      icon: Send,
      state: done(inviteSent),
      ts: tx.invite_sent_at,
    },
    {
      key: "recipient",
      label: "Recipient verified",
      icon: UserCheck,
      state: done(recipientConfirmed),
      ts: tx.recipient_confirmed_at,
      hint: !recipientConfirmed && inviteSent ? "Awaiting recipient confirmation" : undefined,
    },
    {
      key: "payment",
      label: "Payment ready",
      icon: Lock,
      state: done(paid),
      hint: recipientConfirmed && !paid ? "Complete payment securely" : undefined,
    },
    {
      key: "released",
      label: "Payment completed",
      icon: ShieldCheck,
      state: done(released),
      ts: tx.released_at,
    },
  ];

  // Mark the first non-done step as current
  const firstTodo = steps.findIndex((x) => x.state === "todo");
  if (firstTodo !== -1 && !failed) steps[firstTodo].state = "current";

  if (failed) {
    return [
      ...steps.filter((x) => x.state === "done"),
      {
        key: "failed",
        label:
          s === "expired"
            ? "Transfer expired"
            : s === "refunded"
              ? "Refunded to sender"
              : "Transfer cancelled",
        icon: s === "expired" ? Clock : XCircle,
        state: "failed",
      },
    ];
  }

  return steps;
}

export function TransferTimeline({ tx, className }: { tx: TimelineTx; className?: string }) {
  const steps = buildSteps(tx);
  return (
    <div className={cn("rounded-3xl bg-card p-5 shadow-card", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold tracking-tight">Transfer timeline</h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Realtime
        </span>
      </div>
      <ol className="relative space-y-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === steps.length - 1;
          const dot =
            step.state === "done"
              ? "bg-accent text-accent-foreground"
              : step.state === "current"
                ? "bg-lock text-lock-foreground animate-lock-pulse"
                : step.state === "failed"
                  ? "bg-destructive-soft text-destructive"
                  : "bg-secondary text-muted-foreground";
          const labelTone =
            step.state === "todo"
              ? "text-muted-foreground"
              : step.state === "failed"
                ? "text-destructive"
                : "text-foreground";
          return (
            <li key={step.key} className="relative flex gap-3">
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[15px] top-8 bottom-[-1rem] w-px",
                    step.state === "done" ? "bg-accent/50" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  dot,
                )}
              >
                {step.state === "done" ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p className={cn("text-[13px] font-semibold leading-tight", labelTone)}>
                  {step.label}
                </p>
                {step.ts && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {format(new Date(step.ts), "MMM d · h:mm a")} ·{" "}
                    {formatDistanceToNowStrict(new Date(step.ts), { addSuffix: true })}
                  </p>
                )}
                {step.hint && !step.ts && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{step.hint}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
