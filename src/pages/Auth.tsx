import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Lock, Mail, ArrowLeft, Phone as PhoneIcon, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

function SmsConsent({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="animate-slide-up rounded-2xl border border-border/70 bg-secondary/40 p-3.5">
      <label htmlFor={id} className="flex items-start gap-2.5 cursor-pointer select-none">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(v) => onChange(v === true)}
          className="mt-0.5 h-[18px] w-[18px] rounded-md transition-all data-[state=checked]:scale-105"
          aria-describedby={`${id}-desc`}
        />
        <span className="text-[12.5px] font-medium leading-snug text-foreground">
          I agree to receive transactional SMS messages from LockPay
        </span>
      </label>
      <p id={`${id}-desc`} className="mt-2 text-[10.5px] leading-[1.45] text-muted-foreground">
        By continuing, you agree to receive transactional SMS messages from LockPay related to
        account verification, secure transfers, security alerts, payment activity, and transfer
        confirmations. Message frequency varies. Message &amp; data rates may apply. Reply{" "}
        <span className="font-semibold text-foreground">STOP</span> to opt out and{" "}
        <span className="font-semibold text-foreground">HELP</span> for help. See our{" "}
        <Link to="/sms-policy" className="underline underline-offset-2 hover:text-foreground">
          SMS Policy
        </Link>
        .
      </p>
    </div>
  );
}

const phoneSchema = z.string().trim().regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +14155551234");

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

interface Props { mode: "login" | "signup"; }

export default function AuthPage({ mode }: Props) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  // Phone OTP state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState<"idle" | "code">("idle");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  async function sendOtp() {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setOtpSending(true);
    const { data, error } = await supabase.functions.invoke("phone-login-start", { body: { phone: parsed.data } });
    setOtpSending(false);
    const err = (data as { error?: string } | null)?.error;
    if (error || err) { toast.error(err ?? error?.message ?? "Could not send code"); return; }
    toast.success("Code sent — check your messages");
    setOtpStep("code");
    setOtp("");
  }

  async function verifyOtp() {
    if (otp.length < 4) { toast.error("Enter the code"); return; }
    setOtpVerifying(true);
    const { data, error } = await supabase.functions.invoke("phone-login-verify", { body: { phone: phone.trim(), code: otp } });
    const payload = data as { verified?: boolean; password?: string; phone?: string; error?: string } | null;
    if (error || !payload?.verified || !payload.password) {
      setOtpVerifying(false);
      toast.error(payload?.error ?? error?.message ?? "Incorrect code");
      return;
    }
    const { error: signErr } = await supabase.auth.signInWithPassword({
      phone: payload.phone ?? phone.trim(),
      password: payload.password,
    });
    setOtpVerifying(false);
    if (signErr) { toast.error(signErr.message); return; }
    toast.success("Signed in");
    navigate("/");
  }

  if (!authLoading && user) return <Navigate to="/" replace />;

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName.trim() || undefined },
          },
        });
        if (error) throw error;
        toast.success("Account created — welcome to LockPay");
        navigate("/onboarding");
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
      }
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(result.error.message ?? "Google sign-in failed"); setLoading(false); return; }
    if (result.redirected) return;
    navigate("/");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-background to-secondary/60 px-6 pt-safe pb-8">
      <div className="pointer-events-none absolute -top-32 -right-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="page-enter relative w-full max-w-sm space-y-5">
        <Link
          to="/welcome"
          className="-ml-1 inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground active:scale-95 transition-transform"
          aria-label="Back to welcome"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-elevated">
            <Lock className="h-7 w-7 text-primary-foreground" strokeWidth={2.4} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">LockPay</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignup ? "Create your secure transfer account" : "Welcome back"}
          </p>
        </div>

        <Tabs defaultValue="email" className="animate-slide-up">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl">
            <TabsTrigger value="email" className="rounded-xl"><Mail className="mr-1.5 h-3.5 w-3.5" />Email</TabsTrigger>
            <TabsTrigger value="phone" className="rounded-xl"><PhoneIcon className="mr-1.5 h-3.5 w-3.5" />Phone</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-card p-6 shadow-card">
              {isSignup && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Alex Carter" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                {isSignup && <p className="text-[11px] text-muted-foreground">Use at least 6 characters. We hash &amp; encrypt every credential.</p>}
              </div>
              <Button type="submit" className="w-full h-12 rounded-2xl text-base font-semibold" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                {loading ? (isSignup ? "Creating account…" : "Signing in…") : (isSignup ? "Create account" : "Sign in")}
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-2 text-xs text-muted-foreground">or</span></div>
              </div>

              <Button type="button" variant="outline" className="w-full h-12 rounded-2xl" onClick={handleGoogle} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                )}
                Continue with Google
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="phone">
            <div className="space-y-4 rounded-3xl bg-card p-6 shadow-card">
              {otpStep === "idle" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="ph"><PhoneIcon className="mr-1 inline h-3.5 w-3.5" />Phone number</Label>
                    <Input id="ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+14155551234" autoComplete="tel" />
                  </div>
                  <Button onClick={sendOtp} disabled={otpSending} className="w-full h-12 rounded-xl text-base font-semibold">
                    {otpSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {otpSending ? "Sending…" : "Send verification code"}
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    We'll text you a 6-digit code via SMS. Standard rates may apply.
                  </p>
                </>
              )}
              {otpStep === "code" && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Code sent to <span className="font-semibold text-foreground">{phone}</span>
                  </p>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        {[0,1,2,3,4,5].map((i) => (
                          <InputOTPSlot key={i} index={i} className="h-12 w-10 text-base" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setOtpStep("idle")}>
                      Back
                    </Button>
                    <Button className="flex-1 h-11 rounded-xl" onClick={verifyOtp} disabled={otpVerifying || otp.length < 4}>
                      {otpVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {otpVerifying ? "Verifying…" : "Verify & sign in"}
                    </Button>
                  </div>
                  <button type="button" onClick={sendOtp} disabled={otpSending} className="block w-full text-center text-[11px] text-muted-foreground hover:text-foreground">
                    {otpSending ? "Sending…" : "Resend code"}
                  </button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Link
          to={isSignup ? "/login" : "/signup"}
          className="flex h-12 items-center justify-center rounded-2xl bg-card text-sm font-medium text-muted-foreground shadow-card active:scale-[0.98] transition-transform"
        >
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span className="ml-1 font-semibold text-primary">{isSignup ? "Sign in" : "Sign up"}</span>
        </Link>
        <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
          By continuing you agree to our{" "}
          <Link to="/terms" className="underline">Terms</Link> and{" "}
          <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
