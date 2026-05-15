import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { SuccessMark } from "@/components/SuccessMark";
import { haptic } from "@/lib/native";

interface Props {
  title?: string;
  subtitle?: string;
  /** Auto-dismiss callback after `delayMs`. */
  onDone?: () => void;
  delayMs?: number;
}

/**
 * Full-screen "Verified" moment shown after a successful identity / phone
 * verification step. Provides emotional reassurance + a smooth handoff
 * into the next surface (dashboard / next step).
 */
export function VerifiedSuccess({
  title = "You're verified",
  subtitle = "Your account is secured. Pay with confidence on LockPay.",
  onDone,
  delayMs = 1600,
}: Props) {
  useEffect(() => {
    haptic("medium");
    if (!onDone) return;
    const t = setTimeout(onDone, delayMs);
    return () => clearTimeout(t);
  }, [onDone, delayMs]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-xl pt-safe pb-safe animate-fade-in">
      <div className="px-8 text-center">
        <SuccessMark tone="accent" size={120} />
        <p className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          <ShieldCheck className="h-3.5 w-3.5" /> Identity confirmed
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-balance">{title}</h2>
        <p className="mx-auto mt-2 max-w-[280px] text-sm text-muted-foreground text-balance leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
