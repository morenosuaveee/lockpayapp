import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const REASONS = [
  "Unusual transfer volume",
  "Repeated failed unlock attempts",
  "Recipient never claims transfers",
  "Possible account takeover",
  "Chargeback or payment dispute risk",
  "Identity details do not match",
  "Other — see notes",
] as const;

type Severity = "low" | "medium" | "high";

export function FlagActivityDialog({
  userId,
  transactionId,
  label = "Flag activity",
  size = "default",
  onFlagged,
}: {
  userId: string;
  transactionId?: string | null;
  label?: string;
  size?: "default" | "sm";
  onFlagged?: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [severity, setSeverity] = useState<Severity>("medium");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("activity_flags").insert({
      user_id: userId,
      transaction_id: transactionId ?? null,
      reason,
      severity,
      notes: notes.trim() || null,
      created_by: user.id,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Activity flagged for review");
    setNotes("");
    setOpen(false);
    onFlagged?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className="rounded-2xl text-destructive hover:bg-destructive-soft hover:text-destructive"
        >
          <Flag className="mr-1.5 h-3.5 w-3.5" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Flag suspicious activity</DialogTitle>
          <DialogDescription>
            {transactionId
              ? "This flag is attached to a single transfer."
              : "This flag is attached to the sender's account."}{" "}
            Flags are visible to administrators only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low — monitor</SelectItem>
                <SelectItem value="medium">Medium — review soon</SelectItem>
                <SelectItem value="high">High — act now</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="flag-notes">Notes</Label>
            <Textarea
              id="flag-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you observe?"
              className="min-h-24 rounded-xl"
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={submit}
            disabled={saving}
            className="w-full rounded-2xl h-12 text-base font-semibold"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Submit flag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
