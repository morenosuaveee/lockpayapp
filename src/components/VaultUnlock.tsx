import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** When true, plays the door-open + checkmark reveal. */
  unlocked?: boolean;
  size?: number;
  className?: string;
}

/**
 * Premium vault unlock animation.
 * - Closed state: metallic vault face with combination dial.
 * - Unlocked state: doors swing open revealing a soft mint glow + check seal.
 * Communicates "Funds are now securely released."
 */
export function VaultUnlock({ unlocked = false, size = 132, className }: Props) {
  return (
    <div
      className={cn("relative mx-auto", className)}
      style={{ width: size, height: size, perspective: 600 }}
      aria-hidden
    >
      {/* Expanding secure glow ring (only when unlocking) */}
      {unlocked && (
        <>
          <span className="absolute inset-0 rounded-full bg-accent/30 animate-vault-glow" />
          <span
            className="absolute inset-0 rounded-full bg-accent/20 animate-vault-glow"
            style={{ animationDelay: "0.25s" }}
          />
        </>
      )}

      {/* Vault interior: mint glow + checkmark seal (revealed when doors open) */}
      <div
        className={cn(
          "absolute inset-2 rounded-full overflow-hidden",
          "bg-[radial-gradient(circle_at_center,hsl(var(--accent)/0.95),hsl(var(--accent)/0.55)_55%,hsl(var(--primary))_100%)]",
          "shadow-[inset_0_0_24px_hsl(var(--primary)/0.45)]",
          "flex items-center justify-center",
        )}
      >
        {unlocked && (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full bg-card/90 backdrop-blur shadow-elevated animate-success-pop"
            style={{ animationDelay: "0.7s", animationFillMode: "both" }}
          >
            <Check className="h-7 w-7 text-accent-foreground" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Vault frame (metallic ring) */}
      <div
        className={cn(
          "absolute inset-0 rounded-full",
          "bg-[conic-gradient(from_140deg,hsl(220_15%_88%),hsl(220_18%_72%),hsl(220_15%_92%),hsl(220_18%_70%),hsl(220_15%_88%))]",
          "shadow-[inset_0_2px_6px_hsl(0_0%_100%/0.7),inset_0_-3px_10px_hsl(222_30%_20%/0.25),0_10px_30px_-8px_hsl(222_40%_15%/0.35)]",
        )}
        style={{ padding: 6 }}
      >
        <div className="h-full w-full rounded-full bg-[linear-gradient(180deg,hsl(220_18%_94%),hsl(220_15%_82%))]" />
      </div>

      {/* Door halves (open outward when unlocked) */}
      <div className="absolute inset-2 rounded-full" style={{ transformStyle: "preserve-3d" }}>
        <VaultDoorHalf side="left" open={unlocked} />
        <VaultDoorHalf side="right" open={unlocked} />
      </div>

      {/* Combination dial (sits on closed doors; fades on unlock) */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={cn(
              "relative h-12 w-12 rounded-full",
              "bg-[radial-gradient(circle_at_30%_30%,hsl(220_15%_98%),hsl(220_15%_75%)_70%,hsl(220_18%_60%))]",
              "shadow-[inset_0_1px_2px_hsl(0_0%_100%/0.8),inset_0_-2px_4px_hsl(222_30%_20%/0.35),0_2px_4px_hsl(222_30%_20%/0.3)]",
            )}
          >
            <span className="absolute left-1/2 top-1 h-3 w-[2px] -translate-x-1/2 rounded-full bg-foreground/70" />
            <Lock className="absolute inset-0 m-auto h-4 w-4 text-foreground/70" />
          </div>
        </div>
      )}
    </div>
  );
}

function VaultDoorHalf({ side, open }: { side: "left" | "right"; open: boolean }) {
  const isLeft = side === "left";
  return (
    <div
      className={cn(
        "absolute top-0 h-full w-1/2 overflow-hidden",
        isLeft ? "left-0 rounded-l-full" : "right-0 rounded-r-full",
        open && (isLeft ? "animate-vault-door-left" : "animate-vault-door-right"),
      )}
      style={{
        backgroundImage: isLeft
          ? "linear-gradient(90deg, hsl(220 18% 92%), hsl(220 15% 78%) 80%, hsl(220 20% 60%))"
          : "linear-gradient(270deg, hsl(220 18% 92%), hsl(220 15% 78%) 80%, hsl(220 20% 60%))",
        boxShadow: isLeft
          ? "inset -2px 0 6px hsl(222 30% 20% / 0.35), inset 0 1px 2px hsl(0 0% 100% / 0.6)"
          : "inset 2px 0 6px hsl(222 30% 20% / 0.35), inset 0 1px 2px hsl(0 0% 100% / 0.6)",
        backfaceVisibility: "hidden",
      }}
    >
      {/* Subtle vertical seam highlight for metallic depth */}
      <span
        className={cn(
          "absolute top-2 bottom-2 w-px bg-foreground/10",
          isLeft ? "right-0" : "left-0",
        )}
      />
      {/* Rivets */}
      <span className={cn("absolute top-3 h-1 w-1 rounded-full bg-foreground/30", isLeft ? "left-3" : "right-3")} />
      <span className={cn("absolute bottom-3 h-1 w-1 rounded-full bg-foreground/30", isLeft ? "left-3" : "right-3")} />
    </div>
  );
}

/**
 * Restrained, Apple-style spark/confetti burst.
 * Small light sparks rise in a soft arc with blur + fade.
 * Render inside a `relative` parent.
 */
export function ConfettiSparks({ count = 14 }: { count?: number }) {
  // Deterministic positions around center; subtle, layered, never casino-y.
  const sparks = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const dist = 70 + ((i * 37) % 50);
    return {
      sx: Math.cos(angle) * dist,
      sy: Math.sin(angle) * dist - 40,
      delay: (i % 6) * 0.06,
      size: 4 + (i % 3),
      tone: i % 3 === 0 ? "primary" : "accent",
      blur: i % 4 === 0 ? 1.5 : 0.5,
    };
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {sparks.map((s, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full animate-spark"
          style={{
            width: s.size,
            height: s.size,
            background:
              s.tone === "accent"
                ? "hsl(var(--accent) / 0.85)"
                : "hsl(var(--primary-glow) / 0.65)",
            boxShadow:
              s.tone === "accent"
                ? "0 0 10px hsl(var(--accent) / 0.7)"
                : "0 0 8px hsl(var(--primary-glow) / 0.5)",
            filter: `blur(${s.blur}px)`,
            // CSS vars consumed by spark-rise keyframes
            ["--sx" as string]: `${s.sx}px`,
            ["--sy" as string]: `${s.sy}px`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
