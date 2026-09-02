import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Loader2,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { calcAge } from "@/lib/age";
import { toast } from "sonner";

type AdminUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  phone_number: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  date_of_birth: string | null;
  created_at: string;
  identity_status: string | null;
  onboarding_completed_at: string | null;
  terms_accepted_at: string | null;
  privacy_policy_accepted_at: string | null;
  is_admin: boolean;
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function accountStatus(u: AdminUser): { label: string; tone: string } {
  if (!u.email_verified) return { label: "Pending email", tone: "bg-destructive-soft text-destructive" };
  if (u.identity_status === "verified" && u.onboarding_completed_at)
    return { label: "Active", tone: "bg-accent-soft text-accent-foreground" };
  return { label: "Onboarding", tone: "bg-secondary text-muted-foreground" };
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (term: string) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users", {
      _search: term || null,
      _limit: 200,
      _offset: 0,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as AdminUser[]);
  }, []);

  useEffect(() => {
    void load(debounced);
  }, [debounced, load]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      verified: rows.filter((r) => r.email_verified).length,
      phone: rows.filter((r) => r.phone_verified).length,
    }),
    [rows],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 px-5 pb-4 pt-[max(env(safe-area-inset-top),1rem)] backdrop-blur">
        <Link
          to="/profile"
          className="-ml-1 inline-flex h-9 items-center gap-1 rounded-full px-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Users className="h-5 w-5 text-accent" /> User directory
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Administrator view. Access is enforced database-side.
        </p>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or phone"
            className="h-11 rounded-2xl pl-9"
            aria-label="Search users"
          />
        </div>
      </header>

      <main className="px-5 py-5">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Users" value={stats.total} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Email verified" value={stats.verified} icon={<Mail className="h-4 w-4" />} />
          <StatCard label="Phone verified" value={stats.phone} icon={<Phone className="h-4 w-4" />} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No users found.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {rows.map((u) => {
              const status = accountStatus(u);
              const name =
                [u.first_name, u.last_name].filter(Boolean).join(" ") || u.display_name || "Unnamed";
              const age = calcAge(u.date_of_birth);
              return (
                <li key={u.id} className="rounded-3xl bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                        {name}
                        {u.is_admin && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-lock-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                            <ShieldCheck className="h-2.5 w-2.5" /> Admin
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{u.email ?? "—"}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {u.phone_number ?? "No phone"}
                        {age !== null && <span> · {age} yrs</span>}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status.tone}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10.5px]">
                    <Chip on={u.email_verified} label="Email" />
                    <Chip on={u.phone_verified} label="Phone" />
                    <Chip on={u.identity_status === "verified"} label="Identity" />
                    <Chip on={!!u.terms_accepted_at} label="Terms" />
                    <Chip on={!!u.privacy_policy_accepted_at} label="Privacy" />
                    <span className="ml-auto text-muted-foreground">
                      Joined {fmtDate(u.created_at)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Button
          variant="outline"
          className="mt-6 w-full rounded-2xl"
          onClick={() => void load(debounced)}
        >
          Refresh
        </Button>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Personal data shown here is restricted to authorized administrators and must be handled per
          the Lock Pay Privacy Policy.
        </p>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card p-3 shadow-card">
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
      </span>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[10.5px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Chip({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium ${
        on ? "bg-accent-soft text-accent-foreground" : "bg-secondary text-muted-foreground"
      }`}
    >
      <BadgeCheck className={`h-2.5 w-2.5 ${on ? "" : "opacity-40"}`} />
      {label}
    </span>
  );
}
