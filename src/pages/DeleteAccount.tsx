import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LegalFooter, SUPPORT_EMAIL } from "@/components/layout/LegalFooter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function DeleteAccount() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<{ requested_at: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("deletion_requests")
      .select("requested_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setExisting(data);
        setLoading(false);
      });
  }, [user]);

  async function submit() {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("deletion_requests").insert({
      user_id: user.id,
      email: user.email ?? null,
      reason: reason.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deletion request submitted");
    setExisting({ requested_at: new Date().toISOString() });
  }

  return (
    <AppShell>
      <div className="px-6 pt-4">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <h1 className="mt-4 text-2xl font-bold tracking-tight">Delete account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Request permanent deletion of your LockPay account and personal data.
        </p>

        {loading ? (
          <div className="mt-6 h-32 animate-pulse rounded-2xl bg-muted" />
        ) : existing ? (
          <div className="mt-6 rounded-2xl border border-accent/30 bg-accent-soft p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent-foreground" />
              <div>
                <p className="text-sm font-semibold text-accent-foreground">Request received</p>
                <p className="mt-1 text-xs leading-relaxed text-accent-foreground/80">
                  We received your request on{" "}
                  {new Date(existing.requested_at).toLocaleDateString()}. Our team will process it
                  within 7 days. You'll receive a confirmation email at the address on file.
                </p>
                <p className="mt-2 text-xs text-accent-foreground/80">
                  Need to follow up? Email{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive-soft p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                <div className="text-xs leading-relaxed text-destructive">
                  <p className="font-semibold">This is permanent.</p>
                  <p className="mt-1">
                    All your account data, transaction history, and payment methods will be deleted
                    within 7 days of approval. Active locked agreements must be released or expire
                    before deletion is processed.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <label className="text-xs font-medium text-muted-foreground">
                Reason for deletion (optional)
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us improve — why are you leaving?"
                maxLength={500}
                rows={4}
              />
              <Button
                onClick={submit}
                disabled={submitting}
                variant="destructive"
                className="h-12 w-full rounded-2xl text-sm font-semibold"
              >
                {submitting ? "Submitting…" : "Request account deletion"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/profile")}
                className="h-12 w-full rounded-2xl text-sm font-semibold"
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
      <LegalFooter />
    </AppShell>
  );
}
