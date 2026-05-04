import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

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
            <h1 className="mt-6 text-2xl font-bold">Confirming payment…</h1>
            <p className="mt-2 text-sm text-muted-foreground">Locking your funds in escrow.</p>
          </>
        )}

        {state === "locked" && (
          <div className="animate-unlock-burst flex flex-col items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full gradient-lock animate-lock-pulse">
              <Lock className="h-10 w-10 text-lock-foreground" strokeWidth={2.4} />
            </div>
            <h1 className="mt-6 text-2xl font-bold">Locked & on hold</h1>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              {amount !== null && <>${amount.toFixed(2)} </>}
              held in escrow for <span className="font-semibold text-foreground">{recipient}</span>. Share the unlock code to release.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Auto-refunds in 48h if not unlocked.</p>

            <div className="mt-8 w-full space-y-2 max-w-sm">
              <Button onClick={() => navigate(`/unlock/${txnId}`)} className="w-full h-14 rounded-2xl text-base font-semibold">
                View transaction
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full h-14 rounded-2xl text-base font-semibold bg-card">
                Back home
              </Button>
            </div>
          </div>
        )}

        {(state === "timeout" || state === "error") && (
          <>
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h1 className="mt-6 text-2xl font-bold">Still confirming…</h1>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Your payment may still be processing. Check the transactions tab in a moment.
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
