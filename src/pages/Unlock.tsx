import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ShieldCheck, KeyRound, CheckCircle2, ArrowRight, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatDistanceToNowStrict } from "date-fns";

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

interface Preview {
  amount: number;
  sender_display_name: string;
  expires_at: string;
  note: string | null;
}

export default function Unlock() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Support ?t= / ?token= / ?claim= from invite links, SMS and email CTAs.
  const token = params.get("t") || params.get("token") || params.get("claim") || "";
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(!!token);

  useEffect(() => {
    track("unlock_landing_view", {
      referrer: document.referrer,
      utm: window.location.search,
      has_token: !!token,
    });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase.rpc("claim_lookup", { _token: token });
      if (!mounted) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setPreview({
          amount: Number((row as { amount: number }).amount),
          sender_display_name: (row as { sender_display_name: string }).sender_display_name,
          expires_at: (row as { expires_at: string }).expires_at,
          note: (row as { note: string | null }).note ?? null,
        });
      }
      setPreviewLoading(false);
    })();
    return () => { mounted = false; };
  }, [token]);

  const claimPath = token ? `/claim/${token}` : "";

  // Signed-in users go straight to the claim screen (or the app when no token).
  if (!loading && user) return <Navigate to={token ? claimPath : "/"} replace />;

  function handleCTA() {
    track("unlock_cta_click", { has_token: !!token });
    if (token) {
      navigate(`/signup?next=${encodeURIComponent(claimPath)}&src=unlock`);
    } else {
      navigate("/signup?next=/&src=unlock");
    }
  }

  const expiresLabel = preview
    ? `Expires in ${formatDistanceToNowStrict(new Date(preview.expires_at))}`
    : "Expires in 24h";

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
            <Clock className="h-3 w-3" /> {expiresLabel}
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
            {preview
              ? `${preview.sender_display_name} sent you a protected transfer.`
              : "Your money is locked and protected."}
          </p>

          {/* Amount preview */}
          <div className="mt-6 inline-flex items-baseline gap-1 rounded-2xl bg-slate-50 px-5 py-3 ring-1 ring-slate-100">
            <span className="text-xs font-medium text-slate-500">Pending</span>
            <span className="ml-2 text-2xl font-semibold tracking-tight text-slate-900">
              {previewLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              ) : preview ? (
                `$${preview.amount.toFixed(2)}`
              ) : (
                "Awaiting details"
              )}
            </span>
          </div>

          {preview?.note && (
            <p className="mt-4 max-w-[300px] rounded-xl bg-slate-50 px-3 py-2 text-[13px] text-slate-600 ring-1 ring-slate-100">
              "{preview.note}"
            </p>
          )}

          {/* CTA */}
          <Button
            onClick={handleCTA}
            disabled={previewLoading}
            className="mt-8 h-14 w-full rounded-2xl bg-gradient-to-b from-[#3B82F6] to-[#1E54E0] text-base font-semibold text-white shadow-[0_14px_30px_-10px_rgba(47,115,255,0.6)] transition-all active:scale-[0.98] hover:from-[#4A8BFF] hover:to-[#2563EB]"
          >
            Unlock Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {/* Trust indicators */}
          <ul className="mt-7 w-full space-y-2.5 text-left">
            {[
              { icon: ShieldCheck, label: "Protected until both sides confirm" },
              { icon: CheckCircle2, label: "Recipient confirmation required" },
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
            to={token ? `/login?next=${encodeURIComponent(claimPath)}` : "/login"}
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
