import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Create account", "Verify identity", "Secure transfer"];

interface Props {
  /** 0 = create account, 1 = verify identity, 2 = transfer ready */
  current: 0 | 1 | 2;
  className?: string;
}

/**
 * Premium 3-step progress used across onboarding/auth surfaces.
 * iOS-style: ringed dots connected by a hairline rail, with a subtle accent
 * fill for completed/current state.
 */
export function OnboardingProgress({ current, className }: Props) {
  return (
    <ol
      aria-label="Account setup progress"
      className={cn("flex items-center gap-2 px-1", className)}
    >
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                  done && "bg-accent text-accent-foreground",
                  active && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                  !done && !active && "bg-secondary text-muted-foreground",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-tight whitespace-nowrap leading-none",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mt-[-14px] h-[2px] flex-1 rounded-full transition-colors",
                  i < current ? "bg-accent" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
