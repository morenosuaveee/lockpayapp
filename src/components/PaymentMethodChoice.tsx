import { Building2, CreditCard, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/native";

export type PayMethod = "card" | "bank";

interface Props {
  value: PayMethod;
  onChange: (m: PayMethod) => void;
  disabled?: boolean;
}

const OPTIONS: {
  id: PayMethod;
  icon: typeof CreditCard;
  title: string;
  subtitle: string;
  timing: string;
}[] = [
  {
    id: "card",
    icon: CreditCard,
    title: "Card",
    subtitle: "Debit or credit card",
    timing: "Instant",
  },
  {
    id: "bank",
    icon: Building2,
    title: "Bank account",
    subtitle: "Sign in to your bank securely",
    timing: "3–5 business days",
  },
];

export function PaymentMethodChoice({ value, onChange, disabled }: Props) {
  return (
    <div className="rounded-3xl bg-card p-1.5 shadow-card">
      {OPTIONS.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (active) return;
              haptic("light");
              onChange(o.id);
            }}
            aria-pressed={active}
            className={cn(
              "flex w-full items-center gap-3.5 rounded-[1.25rem] px-3.5 py-3.5 text-left transition-colors",
              active ? "bg-primary-soft" : "hover:bg-muted/60",
              disabled && "opacity-60",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors",
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <o.icon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[15px] font-semibold">{o.title}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {o.timing}
                </span>
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{o.subtitle}</span>
            </span>
            {active && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
