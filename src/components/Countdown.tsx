import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function fmt(ms: number) {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600).toString().padStart(2, "0");
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

interface Props {
  expiresAt: string;
  className?: string;
  label?: string;
  onExpire?: () => void;
}

export function Countdown({ expiresAt, className, label = "Unlocks in", onExpire }: Props) {
  const target = new Date(expiresAt).getTime();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = target - now;
  const expired = remaining <= 0;

  useEffect(() => {
    if (expired) onExpire?.();
  }, [expired, onExpire]);

  // Color shifts as the window narrows.
  const tone =
    remaining < 60 * 60 * 1000
      ? "bg-destructive-soft text-destructive"
      : remaining < 6 * 60 * 60 * 1000
      ? "bg-lock-soft text-lock-foreground"
      : "bg-secondary text-foreground";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums shadow-card",
        tone,
        className,
      )}
      aria-live="polite"
    >
      <Clock className={cn("h-3.5 w-3.5", !expired && "animate-pulse")} />
      <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">{label}</span>
      <span>{expired ? "Expired" : fmt(remaining)}</span>
    </div>
  );
}
