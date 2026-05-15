import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck, Loader2, Apple, Lock, BadgeCheck } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function GetStarted() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<null | "google" | "apple">(null);

  if (!authLoading && user) return <Navigate to="/" replace />;

  async function oauth(provider: "google" | "apple") {
    setLoading(provider);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error(result.error.message ?? `${provider} sign-in failed`);
      setLoading(null);
      return;
    }
    if (result.redirected) return;
    navigate("/");
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-background to-secondary/60 px-6 pt-safe pb-8">
      <div className="pointer-events-none absolute -top-32 -right-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative">
        <Link
          to="/welcome"
          className="-ml-1 inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      <div className="page-enter relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-elevated">
            <ShieldCheck className="h-7 w-7 text-primary-foreground" strokeWidth={2.4} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Verify identity to continue</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Secure identity-confirmed transfers.
          </p>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-card space-y-3">
          <Button
            asChild
            className="h-12 w-full rounded-2xl text-base font-semibold gradient-primary text-primary-foreground hover:opacity-95"
          >
            <Link to="/signup">
              <Mail className="mr-2 h-4 w-4" />
              Continue with Email
            </Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-2xl text-base font-medium"
            onClick={() => oauth("google")}
            disabled={loading !== null}
          >
            {loading === "google" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            )}
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-2xl text-base font-medium"
            onClick={() => oauth("apple")}
            disabled={loading !== null}
          >
            {loading === "apple" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Apple className="mr-2 h-4 w-4" />
            )}
            Continue with Apple
          </Button>

          <div className="pt-2 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-border/60 bg-card/50 p-4 text-[12px] text-muted-foreground">
          <div className="flex items-start gap-2">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p>Identity verification is required before any transfer can be initiated.</p>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p>Encrypted in transit with TLS 1.2+. We never store raw card numbers.</p>
          </div>
        </div>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          By continuing you agree to our{" "}
          <Link to="/terms" className="underline-offset-4 hover:underline">Terms of Service</Link>{" "}
          and acknowledge our{" "}
          <Link to="/privacy" className="underline-offset-4 hover:underline">Privacy Policy</Link>.
        </p>

        <p className="text-center text-[10px] leading-relaxed text-muted-foreground/70">
          Lock Pay is a transfer coordination and recipient verification platform.
          Lock Pay is not a bank, money transmitter, escrow service, or custodial financial institution.
        </p>
      </div>
    </div>
  );
}
