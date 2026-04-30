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
      >
        <InputOTPGroup className="gap-3">
          {[0, 1, 2, 3].map((i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className={cn(
                "h-16 w-14 rounded-2xl border-2 text-2xl font-bold tabular-nums",
                "bg-card shadow-card transition-all",
                "data-[active=true]:border-accent data-[active=true]:ring-4 data-[active=true]:ring-accent/15",
                invalid && "border-destructive text-destructive"
              )}
              {...(masked && value[i] ? { children: "•" } : {})}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
