import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Lock, ShieldCheck, UserCheck, Eye, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    icon: UserCheck,
    title: "Recipient verification required",
    body: "Every recipient is identified before funds move. No identity, no payout.",
  },
  {
    icon: Lock,
    title: "Two-sided code confirmation",
    body: "Sender and recipient must both confirm a 4-digit code to release the transfer.",
  },
  {
    icon: Eye,
    title: "Realtime transfer monitoring",
    body: "Every state change is auditable. Suspicious activity auto-cancels within 48 hours.",
  },
];

/**
 * Collapsible "How LockPay protects you" panel — designed to be embedded
 * on Dashboard / SendMoney to reinforce trust without overwhelming UI.
 */
export function TrustPanel({ className, defaultOpen = false }: { className?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={cn("overflow-hidden rounded-3xl bg-card shadow-card", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left active:bg-secondary/50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-foreground">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold leading-tight">How LockPay protects you</p>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Identity-confirmed recipients · protected transfer workflow
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-border/60 p-4 pt-3 animate-slide-up">
          <ul className="space-y-3">
            {ITEMS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground/80">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold leading-tight">{title}</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              to="/security"
              className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-[11.5px] font-semibold active:scale-[0.98] transition-transform"
            >
              Security Center <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/how-it-works"
              className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-[11.5px] font-semibold active:scale-[0.98] transition-transform"
            >
              How it works <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
