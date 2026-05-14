import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

const SUPPORT_EMAIL = "support@getlockpay.com";

export function LegalFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`mt-10 border-t border-border/60 px-6 pb-6 pt-6 text-[11px] text-muted-foreground ${className}`}>
      <div className="mb-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
        <ShieldCheck className="h-3 w-3" />
        Secure money transfers
      </div>
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
        <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground/40" />
        <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
        <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground/40" />
        <Link to="/support" className="hover:text-foreground">Support</Link>
        <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground/40" />
        <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-foreground">{SUPPORT_EMAIL}</a>
      </nav>
      <p className="mt-4 text-center text-[10.5px] leading-relaxed text-muted-foreground/85">
        <span className="font-semibold text-foreground/80">SMS notice.</span>{" "}
        By providing your phone number, you agree to receive transactional and account-related SMS
        messages from LockPay. Message &amp; data rates may apply. Reply STOP to unsubscribe.
      </p>
      <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground/70">
        LockPay is a secure peer-to-peer money transfer platform focused on recipient verification
        and intentional payments. LockPay does not facilitate gambling, wagering, or sports betting.
      </p>
    </footer>
  );
}

export { SUPPORT_EMAIL };
