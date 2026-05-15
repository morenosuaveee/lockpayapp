import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

interface CodeInputProps {
  value: string;
  onChange: (v: string) => void;
  masked?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function CodeInput({ value, onChange, masked = true, invalid, disabled, autoFocus }: CodeInputProps) {
  return (
    <div className={cn("flex justify-center", invalid && "animate-shake")}>
      <InputOTP
        maxLength={4}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoFocus={autoFocus}
        inputMode="numeric"
        pattern="[0-9]*"
      >
        <InputOTPGroup className="gap-3">
          {[0, 1, 2, 3].map((i) => {
            const filled = !!value[i];
            return (
              <InputOTPSlot
                key={i}
                index={i}
                className={cn(
                  "h-[68px] w-[58px] rounded-2xl border text-3xl font-bold tabular-nums",
                  "bg-card shadow-card transition-all duration-150",
                  filled ? "border-foreground/20" : "border-border/70",
                  "data-[active=true]:border-accent data-[active=true]:ring-4 data-[active=true]:ring-accent/15 data-[active=true]:scale-[1.02]",
                  invalid && "border-destructive text-destructive"
                )}
                {...(masked && filled ? { children: "•" } : {})}
              />
            );
          })}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
