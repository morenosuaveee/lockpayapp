import { cn } from "@/lib/utils";

type Tone = "accent" | "lock";

interface SuccessMarkProps {
  tone?: Tone;
  size?: number;
  className?: string;
  /** Show pulsing concentric rings behind the mark. */
  pulse?: boolean;
}

/**
 * Premium animated confirmation mark — concentric rings + popped circle + drawn checkmark.
 * Used for "Locked", "Released" and other emotional success moments.
 */
export function SuccessMark({ tone = "accent", size = 96, className, pulse = true }: SuccessMarkProps) {
  const isAccent = tone === "accent";
  return (
    <div
      className={cn("relative mx-auto flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {pulse && (
        <>
          <span
            className={cn(
              "absolute inset-0 rounded-full animate-success-ring",
              isAccent ? "bg-accent/30" : "bg-lock/30",
            )}
          />
          <span
            className={cn(
              "absolute inset-0 rounded-full animate-success-ring",
              isAccent ? "bg-accent/20" : "bg-lock/20",
            )}
            style={{ animationDelay: "0.5s" }}
          />
        </>
      )}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full shadow-elevated animate-success-pop",
          isAccent ? "gradient-accent" : "gradient-lock",
        )}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          width={size * 0.5}
          height={size * 0.5}
          stroke={isAccent ? "hsl(var(--accent-foreground))" : "hsl(var(--lock-foreground))"}
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path className="animate-check-draw" d="M5 12.5l4.2 4.2L19 7.2" />
        </svg>
      </div>
    </div>
  );
}
