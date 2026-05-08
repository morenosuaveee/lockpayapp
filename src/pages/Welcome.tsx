import { Link, Navigate } from "react-router-dom";
import { Lock, Shield, Zap, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function Welcome() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-secondary/40 to-background">
      {/* Soft glow accents */}
      <div className="pointer-events-none absolute -top-32 -left-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-20 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
        {/* Logo */}
        <div className="flex items-center gap-2 animate-slide-up">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary shadow-elevated">
            <Lock className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
          </div>
          <span className="text-lg font-bold tracking-tight">LockPay</span>
        </div>

        {/* Hero */}
        <div className="mt-12 animate-slide-up">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-[11px] font-medium text-accent-foreground">
            <Shield className="h-3 w-3" /> Escrow-protected transfers
          </div>
          <h1 className="mt-5 text-balance text-4xl font-bold leading-tight tracking-tight">
            Send Securely.
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Release Confidently.
            </span>
          </h1>
          <p className="mt-4 text-balance text-base leading-relaxed text-muted-foreground">
            Every payment is locked with a code only you and your recipient know.
            Funds release the moment you both unlock — never before.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-10 space-y-3 animate-slide-up" style={{ animationDelay: "60ms" }}>
          <Feature
            icon={<KeyRound className="h-5 w-5" />}
            title="Dual-key release"
            description="A 4-digit code held outside the app keeps both parties in control."
          />
          <Feature
            icon={<Shield className="h-5 w-5" />}
            title="Held in escrow"
            description="Money stays locked safely until the deal is complete."
            tone="lock"
          />
          <Feature
            icon={<Zap className="h-5 w-5" />}
            title="Instant settlement"
            description="The moment both unlock, funds settle on PayPal."
            tone="accent"
          />
        </div>

        {/* CTAs */}
        <div className="mt-auto pt-10 space-y-3 animate-slide-up" style={{ animationDelay: "120ms" }}>
          <Button
            asChild
            className="h-14 w-full rounded-2xl text-base font-semibold gradient-primary text-primary-foreground shadow-elevated hover:opacity-95"
          >
            <Link to="/signup">Create account</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-14 w-full rounded-2xl text-base font-semibold bg-card"
          >
            <Link to="/login">Log in</Link>
          </Button>
          <p className="pt-2 text-center text-[11px] text-muted-foreground">
            By continuing you agree to LockPay's terms & privacy.
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
  tone = "primary",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: "primary" | "accent" | "lock";
}) {
  const toneClass =
    tone === "accent"
      ? "bg-accent-soft text-accent-foreground"
      : tone === "lock"
      ? "bg-lock-soft text-lock-foreground"
      : "bg-secondary text-secondary-foreground";
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
