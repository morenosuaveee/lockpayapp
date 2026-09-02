import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MailCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** Accounts are only fully active once the email address is confirmed. */
export default function VerifyEmail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  // Poll for confirmation so the screen advances on its own.
  useEffect(() => {
    const t = setInterval(async () => {
      const { data } = await supabase.auth.refreshSession();
      if (data.session?.user.email_confirmed_at) {
        await supabase.rpc("sync_my_verification");
        navigate("/onboarding", { replace: true });
      }
    }, 8000);
    return () => clearInterval(t);
  }, [navigate]);

  async function resend() {
    if (!user?.email) return;
    setSending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success("Verification email sent");
  }

  async function checkNow() {
    setChecking(true);
    const { data } = await supabase.auth.refreshSession();
    setChecking(false);
    if (data.session?.user.email_confirmed_at) {
      await supabase.rpc("sync_my_verification");
      toast.success("Email verified");
      navigate("/onboarding", { replace: true });
    } else {
      toast.error("Not verified yet — check your inbox");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/60 px-6 pt-safe">
      <div className="w-full max-w-sm space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-elevated">
          <MailCheck className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verify your email</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{user?.email}</span>. Your account becomes
            fully active — and transfers unlock — once it's confirmed.
          </p>
        </div>
        <div className="space-y-2.5 rounded-3xl bg-card p-5 shadow-card">
          <Button onClick={checkNow} disabled={checking} className="h-12 w-full rounded-2xl">
            {checking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            I've verified — continue
          </Button>
          <Button
            variant="outline"
            onClick={resend}
            disabled={sending}
            className="h-12 w-full rounded-2xl"
          >
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Resend email
          </Button>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/welcome", { replace: true });
            }}
            className="w-full py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
