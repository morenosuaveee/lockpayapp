import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle, ShieldCheck, Clock, Receipt, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { SuccessMark } from "@/components/SuccessMark";

type State = "polling" | "locked" | "clearing" | "timeout" | "error";

export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const txnId = params.get("txn");
  const [state, setState] = useState<State>("polling");
  const [amount, setAmount] = useState<number | null>(null);
  const [recipient, setRecipient] = useState<string>("");

  useEffect(() => {
    if (!txnId) { setState("error"); return; }
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      while (!cancelled && attempts < 20) {
        attempts++;
        const { data } = await supabase
          .from("transactions")
          .select("status, amount, recipient_identifier")
          .eq("id", txnId)
          .maybeSingle();
        if (cancelled) return;
        if (data) {
          setAmount(Number(data.amount));
          setRecipient(data.recipient_identifier);
          if (data.status === "locked" || data.status === "awaiting_confirmation" || data.status === "completed") {
            setState("locked"); return;
          }
          if (data.status === "pending") {
            // Bank (ACH) debit initiated — funds settle in a few business days.
            setState("clearing"); return;
          }
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) setState("timeout");
    };
    poll();
    return () => { cancelled = true; };
  }, [txnId]);

  return (
    <AppShell>
      <div className="flex min-h-[80vh] flex-col items-center px-6 pt-16 pb-10 text-center">
        {state === "polling" && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card shadow-card">
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
            </div>
            <h1 className="mt-7 text-[24px] font-bold tracking-tight">Confirming payment…</h1>
            <p className="mt-1.5 max-w-[280px] text-[13px] text-muted-foreground text-balance">
              Just a few seconds. Don't close the app.
            </p>
          </div>
        )}

        {state === "clearing" && (
          <div className="flex w-full max-w-sm flex-col items-center animate-fade-in">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-lock-soft">
              <Building2 className="h-9 w-9 text-lock" />
            </div>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-lock">Bank transfer started</p>
            <h1 className="mt-1.5 text-[28px] font-bold tracking-tight">Payment clearing</h1>
            {amount !== null && (
              <div className="mt-2 text-[44px] font-bold tabular-nums tracking-tight leading-none">
                ${amount.toFixed(2)}
              </div>
            )}
            <p className="mt-3 max-w-[300px] text-[13px] text-muted-foreground text-balance">
              Your bank debit is on its way. Funds typically settle in 3–5 business days — we'll
              notify you and <span className="font-semibold text-foreground">{recipient}</span> the
              moment it clears and the transfer locks.
            </p>

            <div className="mt-7 w-full divide-y divide-border/60 rounded-3xl bg-card shadow-card text-left">
              <TrustRow icon={ShieldCheck} title="Bank login stays private" subtitle="LockPay never sees your credentials." />
              <TrustRow icon={Clock} title="Settles in 3–5 business days" subtitle="Recipient can complete it once cleared." />
              <TrustRow icon={Receipt} title="Receipt sent" subtitle="Check your email." />
            </div>

            <div className="mt-6 flex w-full flex-col gap-2">
              <Button onClick={() => navigate("/transactions")} className="h-12 rounded-2xl">
                View activity
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")} className="h-11 rounded-2xl text-muted-foreground">
                Back to home
              </Button>
            </div>
          </div>
        )}

        {state === "locked" && (
          <div className="flex w-full max-w-sm flex-col items-center animate-fade-in">
            <SuccessMark tone="lock" size={104} />
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-lock">Awaiting confirmation</p>
            <h1 className="mt-1.5 text-[28px] font-bold tracking-tight">Transfer pending</h1>
            {amount !== null && (
              <div className="mt-2 text-[44px] font-bold tabular-nums tracking-tight leading-none">
                ${amount.toFixed(2)}
              </div>
            )}
            <p className="mt-3 max-w-[280px] text-[13px] text-muted-foreground text-balance">
              Awaiting <span className="font-semibold text-foreground">{recipient}</span>. Share your code to complete.
            </p>

            <div className="mt-7 w-full divide-y divide-border/60 rounded-3xl bg-card shadow-card text-left">
              <TrustRow icon={ShieldCheck} title="End-to-end encrypted" subtitle="Card details never stored." />
              <TrustRow icon={Clock} title="Auto-cancels in 48h" subtitle="No confirmation, no charge." />
              <TrustRow icon={Receipt} title="Receipt sent" subtitle="Check your email." />
            </div>

            <div className="mt-7 w-full space-y-2">
              <Button onClick={() => navigate(`/unlock/${txnId}`)} className="w-full h-[54px] rounded-2xl text-[17px] font-semibold shadow-elevated active:scale-[0.98] transition-transform">
                View transfer
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")} className="w-full h-12 rounded-2xl text-[15px] font-medium text-muted-foreground">
                Back home
              </Button>
            </div>
          </div>
        )}

        {(state === "timeout" || state === "error") && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="mt-6 text-[24px] font-bold tracking-tight">Still processing</h1>
            <p className="mt-1.5 max-w-[280px] text-[13px] text-muted-foreground text-balance">
              You weren't charged twice. It'll show in Activity shortly.
            </p>
            <Button onClick={() => navigate("/transactions")} className="mt-8 w-full max-w-sm h-[54px] rounded-2xl text-[17px] font-semibold">
              View activity
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function TrustRow({ icon: Icon, title, subtitle }: { icon: typeof ShieldCheck; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
        <Icon className="h-4 w-4 text-accent-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold leading-tight">{title}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground leading-snug">{subtitle}</p>
      </div>
    </div>
  );
}
