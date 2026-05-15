import { useEffect, useState } from "react";
import { ShieldCheck, Sparkles, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VaultUnlock, ConfettiSparks } from "@/components/VaultUnlock";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";

interface Props {
  recipientName: string;
  amount: number;
  currency?: string;
  timestamp?: string | Date;
  onRelease: () => Promise<void> | void;
  onCancel?: () => void;
  /** When true, shows the post-release "Payment Released" success burst. */
  released?: boolean;
  onDismiss?: () => void;
}

function initials(name: string) {
  const parts = name.trim().split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * Fullscreen "Recipient Verified — Ready to Release Payment" moment.
 * Premium iOS-native success surface shown once both sides have confirmed
 * the secure 4-digit code and the sender can release the payment.
 */
export function RecipientVerifiedSuccess({
  recipientName,
  amount,
  currency = "USD",
  timestamp,
  onRelease,
  onCancel,
  released = false,
  onDismiss,
}: Props) {
  const [releasing, setReleasing] = useState(false);
  const [done, setDone] = useState(released);

  useEffect(() => {
    haptic("medium");
  }, []);

  useEffect(() => {
    if (released && !done) {
      setDone(true);
      haptic("medium");
    }
  }, [released, done]);

  async function handleRelease() {
    if (releasing || done) return;
    haptic("medium");
    setReleasing(true);
    try {
      await onRelease();
    } finally {
      setReleasing(false);
    }
  }

  const ts = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={done ? "Payment released" : "Recipient verified"}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-primary/40 backdrop-blur-2xl pt-safe pb-safe animate-fade-in"
    >
      {/* Floating glow particles */}
      <FloatingParticles />

      {onDismiss && !releasing && (
        <button
          onClick={onDismiss}
          aria-label="Close"
          className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-card/70 text-foreground backdrop-blur-md shadow-card active:scale-95 transition-transform"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="relative w-full max-w-md px-5 pb-6">
        {/* Hero */}
        <div className="text-center pt-10 sm:pt-4">
          <div className="relative mx-auto" style={{ width: 132, height: 132 }}>
            {/* expanding success ring (only pre-release) */}
            {!done && (
              <>
                <span className="absolute inset-0 rounded-full bg-accent/25 animate-success-ring" />
                <span
                  className="absolute inset-0 rounded-full bg-accent/15 animate-success-ring"
                  style={{ animationDelay: "0.4s" }}
                />
              </>
            )}
            <VaultUnlock unlocked={done} size={132} />
            {done && <ConfettiSparks count={16} />}
          </div>

          <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground animate-scale-in">
            <ShieldCheck className="h-3.5 w-3.5" />
            {done ? "Payment Released" : "Recipient Verified"}
          </p>

          <h2 className="mt-3 text-[28px] font-bold tracking-tight text-balance text-foreground">
            {done ? "Funds Securely Released" : "Recipient Verified"}
          </h2>
          <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-relaxed text-muted-foreground text-balance">
            {done
              ? "The vault is open. Both parties confirmed the secure code — your funds are on their way."
              : "The transfer has been securely confirmed and is ready for payment release."}
          </p>
        </div>

        {/* Glass summary card */}
        <div
          className={cn(
            "mt-7 rounded-3xl border border-border/40 bg-card/80 backdrop-blur-xl p-5 shadow-elevated",
            "animate-slide-up",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-card">
              {initials(recipientName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-foreground">{recipientName}</p>
              <p className="text-[12px] text-muted-foreground">Recipient · {ts}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
              <ShieldCheck className="h-3 w-3" />
              {done ? "Released" : "Verified"}
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between border-t border-border/40 pt-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Transfer amount
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-foreground">
                ${Number(amount).toFixed(2)}
                <span className="ml-1 text-xs font-medium text-muted-foreground">{currency}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-secondary px-2.5 py-1.5 text-[11px] font-medium text-foreground/80">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Secured
            </div>
          </div>
        </div>

        {/* CTAs */}
        {!done ? (
          <div className="mt-6 space-y-2 animate-slide-up" style={{ animationDelay: "0.08s" }}>
            <Button
              onClick={handleRelease}
              disabled={releasing}
              className={cn(
                "w-full h-14 rounded-2xl text-[15px] font-semibold gradient-accent text-accent-foreground",
                "shadow-elevated hover:opacity-95 active:scale-[0.98] transition-all",
                "[box-shadow:0_0_0_4px_hsl(var(--accent)/0.18),0_12px_32px_-8px_hsl(var(--accent)/0.45)]",
              )}
            >
              {releasing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Securing release…
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Release Payment
                </>
              )}
            </Button>
            {onCancel && (
              <Button
                variant="ghost"
                onClick={() => {
                  haptic("light");
                  onCancel();
                }}
                disabled={releasing}
                className="w-full h-12 rounded-2xl text-[14px] font-medium text-muted-foreground hover:bg-secondary"
              >
                Cancel Transfer
              </Button>
            )}
            <p className="pt-1 text-center text-[11px] text-muted-foreground">
              Funds release instantly after you tap Release Payment.
            </p>
          </div>
        ) : (
          <div className="mt-6 animate-slide-up">
            <Button
              onClick={() => {
                haptic("light");
                onDismiss?.();
              }}
              className="w-full h-14 rounded-2xl text-[15px] font-semibold gradient-primary text-primary-foreground active:scale-[0.98] transition-transform"
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function FloatingParticles() {
  // 8 deterministic positions for subtle, restrained sparkle.
  const dots = [
    { l: "12%", t: "18%", d: "0s", s: 6 },
    { l: "82%", t: "12%", d: "0.6s", s: 4 },
    { l: "20%", t: "70%", d: "1.1s", s: 5 },
    { l: "75%", t: "62%", d: "0.3s", s: 7 },
    { l: "48%", t: "8%", d: "0.9s", s: 3 },
    { l: "8%", t: "44%", d: "1.4s", s: 4 },
    { l: "90%", t: "38%", d: "0.2s", s: 5 },
    { l: "55%", t: "78%", d: "1.7s", s: 4 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-accent/60 blur-[1px] animate-pulse"
          style={{
            left: d.l,
            top: d.t,
            width: d.s,
            height: d.s,
            animationDelay: d.d,
            animationDuration: "2.8s",
            boxShadow: "0 0 12px hsl(var(--accent) / 0.6)",
          }}
        />
      ))}
    </div>
  );
}
