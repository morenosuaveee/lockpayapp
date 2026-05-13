import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle, ShieldCheck, Clock, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { SuccessMark } from "@/components/SuccessMark";

type State = "polling" | "locked" | "timeout" | "error";

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
      <div className="px-5 pt-16 pb-10 flex flex-col items-center text-center">
        {state === "polling" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h1 className="mt-6 text-2xl font-bold">Confirming your payment</h1>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground text-balance">Securing your funds in escrow. This usually takes just a few seconds — please don't close the app.</p>
          </>
        )}

        {state === "locked" && (
          <div className="flex w-full max-w-sm flex-col items-center">
            <SuccessMark tone="lock" size={104} />
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-lock">Funds secured</p>
            <h1 className="mt-2 text-[28px] font-bold tracking-tight">Locked in escrow</h1>
            {amount !== null && (
              <div className="mt-3 text-4xl font-bold tabular-nums tracking-tight">
                ${amount.toFixed(2)}
              </div>
            )}
            <p className="mt-2 max-w-xs text-sm text-muted-foreground text-balance">
              Held safely for <span className="font-semibold text-foreground">{recipient}</span>. Share the unlock code to release.
            </p>

            <div className="mt-6 w-full space-y-2 rounded-2xl bg-card p-4 shadow-card text-left">
              <TrustRow icon={ShieldCheck} title="Bank-grade encryption" subtitle="Your card details never touch our servers." />
              <TrustRow icon={Clock} title="Auto-refund in 48h" subtitle="If unlock isn't completed, you're refunded automatically." />
              <TrustRow icon={Receipt} title="Receipt sent" subtitle="A confirmation email is on its way." />
            </div>

            <div className="mt-6 w-full space-y-2">
              <Button onClick={() => navigate(`/unlock/${txnId}`)} className="w-full h-14 rounded-2xl text-base font-semibold active:scale-[0.98] transition-transform">
                View transaction
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full h-12 rounded-2xl text-sm font-semibold bg-card">
                Back home
              </Button>
            </div>
          </div>
        )}

        {(state === "timeout" || state === "error") && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <AlertCircle className="h-7 w-7 text-muted-foreground" />
            </div>
            <h1 className="mt-6 text-2xl font-bold">Taking a little longer</h1>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground text-balance">
              Your payment is still processing with our bank partner. You haven't been charged twice — it'll appear in your transactions shortly.
            </p>
            <Button onClick={() => navigate("/transactions")} className="mt-8 w-full max-w-sm h-14 rounded-2xl text-base font-semibold">
              View transactions
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}

function TrustRow({ icon: Icon, title, subtitle }: { icon: typeof ShieldCheck; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
        <Icon className="h-4 w-4 text-accent-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{subtitle}</p>
      </div>
    </div>
  );
}
