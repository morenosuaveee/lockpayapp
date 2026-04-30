import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Mail, User as UserIcon, CreditCard, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  display_name: z.string().trim().min(1, "Name required").max(80),
  paypal_email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [paypal, setPaypal] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setName(data?.display_name ?? "");
      setPaypal(data?.paypal_email ?? user.email ?? "");
      setPhone(data?.phone ?? "");
      setLoading(false);
    });
  }, [user]);

  async function save() {
    const parsed = schema.safeParse({ display_name: name, paypal_email: paypal, phone });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: parsed.data.display_name,
      paypal_email: parsed.data.paypal_email || null,
      phone: parsed.data.phone || null,
    }).eq("id", user!.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  if (loading) return <AppShell><div className="flex h-screen items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div></AppShell>;

  return (
    <AppShell>
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold">Profile</h1>

        <div className="mt-6 flex items-center gap-4 rounded-3xl bg-card p-5 shadow-card">
          <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary text-2xl font-bold text-primary-foreground">
            {(name?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{name || "Set your name"}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4 rounded-3xl bg-card p-5 shadow-card">
          <div className="space-y-1.5">
            <Label htmlFor="name"><UserIcon className="mr-1 inline h-3.5 w-3.5" />Display name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pp"><Mail className="mr-1 inline h-3.5 w-3.5" />PayPal email</Label>
            <Input id="pp" type="email" value={paypal} onChange={(e) => setPaypal(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ph">Phone</Label>
            <Input id="ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0000" />
          </div>
          <Button onClick={save} disabled={saving} className="w-full h-12 rounded-xl">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <div className="mt-5 rounded-3xl bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><CreditCard className="h-4 w-4" />Linked payment methods</h2>
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-accent-soft p-3">
            <div>
              <p className="font-semibold text-sm">PayPal</p>
              <p className="text-xs text-muted-foreground">{paypal || "Not linked"}</p>
            </div>
            <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">Default</span>
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-dashed border-border p-3 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-accent" />
            More providers (Venmo, bank) coming soon.
          </div>
        </div>

        <Button onClick={signOut} variant="outline" className="mt-5 w-full h-12 rounded-xl text-destructive hover:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </AppShell>
  );
}
