import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, KeyRound, CheckCircle2, ArrowRight, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

function track(event: string, props: Record<string, unknown> = {}) {
  try {
    const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; plausible?: (e: string, o?: { props?: Record<string, unknown> }) => void };
    w.dataLayer?.push({ event, ...props });
    w.gtag?.("event", event, props);
    w.plausible?.(event, { props });
    // eslint-disable-next-line no-console
    console.info("[track]", event, props);
  } catch {
    /* noop */
  }
}

export default function Unlock() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    track("unlock_landing_view", {
      referrer: document.referrer,
      utm: window.location.search,
    });
  }, []);

  if (!loading && user) return <Navigate to="/" replace />;

  function handleCTA() {
    track("unlock_cta_click");
    navigate("/signup?next=/&src=unlock");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Soft blue glow backdrop */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#2F73FF]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[#2F73FF]/10 blur-3xl" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-between px-6 pt-safe pb-8">
        {/* Brand bar */}
        <header className="flex w-full items-center justify-between pt-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#2F73FF] to-[#1E54E0] shadow-[0_8px_24px_-8px_rgba(47,115,255,0.6)]">
              <Lock className="h-4 w-4 text-white" strokeWidth={2.6} />
            </div>
            <span className="text-sm font-semibold tracking-tight">LockPay</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
            <Clock className="h-3 w-3" /> Expires in 24h
          </span>
        </header>

        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          {/* Glowing lock */}
          <div className="relative mb-8">
            <div className="absolute inset-0 -m-8 animate-pulse rounded-full bg-[#2F73FF]/25 blur-2xl" />
            <div className="absolute inset-0 -m-3 rounded-full bg-[#2F73FF]/20 blur-xl" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#3B82F6] to-[#1E54E0] shadow-[0_20px_50px_-12px_rgba(47,115,255,0.55)]">
              <div className="absolute inset-1 rounded-[1.75rem] bg-gradient-to-br from-white/25 to-transparent" />
              <Lock className="relative h-12 w-12 text-white drop-shadow" strokeWidth={2.4} />
            </div>
          </div>

          <h1 className="text-[34px] font-bold leading-tight tracking-tight">
            You've received money
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
            Your money is locked and protected.
          </p>

          {/* Amount preview */}
          <div className="mt-6 inline-flex items-baseline gap-1 rounded-2xl bg-slate-50 px-5 py-3 ring-1 ring-slate-100">
            <span className="text-xs font-medium text-slate-500">Pending</span>
            <span className="ml-2 text-2xl font-semibold tracking-tight text-slate-900">$5.00</span>
          </div>

          {/* CTA */}
          <Button
            onClick={handleCTA}
            className="mt-8 h-14 w-full rounded-2xl bg-gradient-to-b from-[#3B82F6] to-[#1E54E0] text-base font-semibold text-white shadow-[0_14px_30px_-10px_rgba(47,115,255,0.6)] transition-all active:scale-[0.98] hover:from-[#4A8BFF] hover:to-[#2563EB]"
          >
            Unlock Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {/* Trust indicators */}
          <ul className="mt-7 w-full space-y-2.5 text-left">
            {[
              { icon: ShieldCheck, label: "Secured in escrow" },
              { icon: CheckCircle2, label: "Released only when both parties confirm" },
              { icon: KeyRound, label: "Only you can unlock with your code" },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 rounded-2xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2F73FF]/10">
                  <Icon className="h-4 w-4 text-[#1E54E0]" strokeWidth={2.4} />
                </span>
                <span className="text-[13.5px] font-medium text-slate-700">{label}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="w-full pt-6 text-center text-[11px] text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            onClick={() => track("unlock_login_click")}
            className="font-semibold text-[#1E54E0]"
          >
            Sign in
          </Link>
        </footer>
      </main>
    </div>
  );
}
