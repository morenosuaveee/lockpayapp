import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

const SUPPORT_EMAIL = "support@getlockpay.com";

export function LegalFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`mt-10 border-t border-border/60 px-6 pb-6 pt-6 text-[11px] text-muted-foreground ${className}`}>
      <div className="mb-3 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em]">
        <ShieldCheck className="h-3 w-3" />
        Secure conditional payments
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
      <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground/80">
        LockPay is a peer accountability and conditional payment platform. Funds are voluntarily locked
        and released only when predefined release conditions are met. LockPay does not facilitate
        gambling, wagering, or sports betting.
      </p>
    </footer>
  );
}

export { SUPPORT_EMAIL };
