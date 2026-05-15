import { AlertCircle, BadgeCheck, Loader2, Send, ShieldCheck, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type LookupState =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "lockpay_user"; verified: boolean }
  | { state: "will_invite" }
  | { state: "invalid" };

function initials(v: string): string {
  const trimmed = v.trim();
  if (!trimmed) return "?";
  if (trimmed.includes("@")) return trimmed[0].toUpperCase();
  // phone — last 2 digits
  const digits = trimmed.replace(/\D/g, "");
  return digits.slice(-2) || trimmed.slice(0, 2);
}

/**
 * Live recipient lookup card — visualises trust state and reassures the
 * sender that "your money is protected before payment is released."
 */
export function RecipientLookupCard({
  lookup,
  identifier,
  channel,
  className,
}: {
  lookup: LookupState;
  identifier: string;
  channel: "email" | "phone" | null;
  className?: string;
}) {
  if (lookup.state === "idle") return null;
  const base = cn("mt-4 rounded-2xl p-4 animate-fade-in", className);

  if (lookup.state === "checking") {
    return (
      <div className={cn(base, "flex items-center gap-2.5 bg-secondary/60 text-muted-foreground")}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-[13px] font-medium">Looking up recipient…</span>
      </div>
    );
  }

  if (lookup.state === "invalid") {
    return (
      <div className={cn(base, "flex items-center gap-2.5 bg-destructive-soft text-destructive")}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-[13px] font-semibold">Enter a valid email or phone number</span>
      </div>
    );
  }

  if (lookup.state === "lockpay_user") {
    const verified = lookup.verified;
    return (
      <div className={cn(base, verified ? "bg-accent-soft" : "bg-lock-soft")}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold text-[15px]",
              verified ? "bg-accent text-accent-foreground" : "bg-card text-foreground",
            )}
          >
            {initials(identifier)}
            {verified && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card">
                <BadgeCheck className="h-4 w-4 text-accent" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "flex items-center gap-1 text-[13.5px] font-semibold leading-tight",
                verified ? "text-accent-foreground" : "text-lock-foreground",
              )}
            >
              {verified ? "Verified LockPay recipient" : "LockPay user · unverified"}
            </p>
            <p
              className={cn(
                "mt-0.5 text-[11.5px] leading-snug",
                verified ? "text-accent-foreground/80" : "text-lock-foreground/80",
              )}
            >
              {verified
                ? "Identity confirmed · ready to receive secure transfers"
                : "Account exists but identity not yet confirmed"}
            </p>
          </div>
          {verified && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-card/70 px-2 py-1 text-[10px] font-bold text-accent-foreground">
              <ShieldCheck className="h-3 w-3" /> Trusted
            </span>
          )}
        </div>
        <p className="mt-3 flex items-center gap-1.5 border-t border-foreground/5 pt-2.5 text-[11px] font-medium text-foreground/70">
          <ShieldCheck className="h-3 w-3 text-accent" />
          Your money is protected before payment is released.
        </p>
      </div>
    );
  }

  // will_invite
  return (
    <div className={cn(base, "bg-secondary/70")}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border bg-card text-muted-foreground">
          <Send className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold leading-tight text-foreground">
            Recipient will receive a secure invite
          </p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
            We'll send a {channel === "email" ? "secure email" : "verified SMS"} link. They onboard
            and confirm before any funds move — you're charged only after they confirm.
          </p>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 border-t border-border/60 pt-2.5 text-[11px] font-medium text-foreground/70">
        <UserCheck className="h-3 w-3 text-accent" />
        Identity-confirmed recipient · protected transfer workflow
      </p>
    </div>
  );
}
