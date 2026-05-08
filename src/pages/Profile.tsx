import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Mail, User as UserIcon, CreditCard, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneVerificationCard } from "@/components/PhoneVerificationCard";
import { PushNotificationsCard } from "@/components/PushNotificationsCard";
import { ExpoPushTokenCard } from "@/components/ExpoPushTokenCard";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  display_name: z.string().trim().min(1, "Name required").max(80),
  paypal_email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
});

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [paypal, setPaypal] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneVerifiedAt, setPhoneVerifiedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setName(data?.display_name ?? "");
      setPaypal(data?.paypal_email ?? user.email ?? "");
      setPhone(data?.phone ?? null);
      setPhoneVerifiedAt((data as { phone_verified_at?: string | null } | null)?.phone_verified_at ?? null);
      setLoading(false);
    });
  }, [user]);

  async function save() {
    const parsed = schema.safeParse({ display_name: name, paypal_email: paypal });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: parsed.data.display_name,
      paypal_email: parsed.data.paypal_email || null,
    }).eq("id", user!.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/welcome");
  }

  if (loading) {
    return (
      <AppShell>
        <div className="px-5 pt-12 pb-6 stagger">
          <div className="h-8 w-32 rounded-lg skeleton-shimmer" />
          <div className="mt-6 h-24 rounded-3xl skeleton-shimmer" />
          <div className="mt-5 h-56 rounded-3xl skeleton-shimmer" />
          <div className="mt-5 h-44 rounded-3xl skeleton-shimmer" />
          <div className="mt-5 h-44 rounded-3xl skeleton-shimmer" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Manage your identity, security, and payouts.</p>

        <div className="mt-6 stagger">
          <div className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-card">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary text-2xl font-bold text-primary-foreground shadow-elevated ring-4 ring-card">
                {(name?.[0] ?? "?").toUpperCase()}
              </div>
              {phoneVerifiedAt && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground ring-2 ring-card">
                  ✓
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold leading-tight">{name || "Set your name"}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.email}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                <Sparkles className="h-2.5 w-2.5" /> LockPay member
              </span>
            </div>
          </div>

          <p className="eyebrow mt-6">Account details</p>
          <div className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
            <div className="space-y-1.5">
              <Label htmlFor="name"><UserIcon className="mr-1 inline h-3.5 w-3.5" />Display name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pp"><Mail className="mr-1 inline h-3.5 w-3.5" />PayPal email</Label>
              <Input id="pp" type="email" value={paypal} onChange={(e) => setPaypal(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <Button onClick={save} disabled={saving} className="w-full h-12 rounded-xl text-base font-semibold">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>

          <p className="eyebrow mt-6">Security</p>
          <PhoneVerificationCard
            initialPhone={phone}
            verifiedAt={phoneVerifiedAt}
            onVerified={(p, at) => { setPhone(p); setPhoneVerifiedAt(at); }}
          />

          <p className="eyebrow mt-6">Notifications</p>
          <PushNotificationsCard />
          {user && <ExpoPushTokenCard userId={user.id} />}

          <p className="eyebrow mt-6">Payouts</p>
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><CreditCard className="h-4 w-4" />Linked payment methods</h2>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-accent-soft p-3">
              <div>
                <p className="text-sm font-semibold">PayPal</p>
                <p className="text-xs text-muted-foreground">{paypal || "Not linked"}</p>
              </div>
              <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">Default</span>
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-dashed border-border p-3 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              More providers (Venmo, bank) coming soon.
            </div>
          </div>

          <Button onClick={signOut} variant="outline" className="mt-6 w-full h-12 rounded-xl text-destructive hover:bg-destructive-soft hover:text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Protected by 256-bit encryption · LockPay v1.0
          </p>
        </div>
      </div>
    </AppShell>
  );
}
