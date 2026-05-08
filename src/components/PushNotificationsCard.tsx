import { useEffect, useState } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const STORAGE_KEY = "lockpay.pushPrefs";

type Prefs = { lockedAlerts: boolean; releasedAlerts: boolean; expiringAlerts: boolean };
const defaults: Prefs = { lockedAlerts: true, releasedAlerts: true, expiringAlerts: true };

export function PushNotificationsCard() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [prefs, setPrefs] = useState<Prefs>(defaults);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined") { setPerm("unsupported"); return; }
    setPerm(Notification.permission);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...defaults, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  function update<K extends keyof Prefs>(k: K, v: Prefs[K]) {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  async function enable() {
    if (perm === "unsupported") { toast.error("Notifications aren't supported on this device"); return; }
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPerm(result);
      if (result === "granted") {
        toast.success("Notifications enabled");
        new Notification("LockPay alerts on", { body: "We'll ping you when payments lock or release." });
      } else if (result === "denied") {
        toast.error("Permission denied — enable in browser settings");
      }
    } finally { setRequesting(false); }
  }

  const granted = perm === "granted";

  return (
    <div className="rounded-3xl bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {granted ? <BellRing className="h-4 w-4 text-accent" /> : <Bell className="h-4 w-4 text-muted-foreground" />}
          Push notifications
        </h2>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
          granted ? "bg-accent-soft text-accent-foreground" :
          perm === "denied" ? "bg-destructive-soft text-destructive" :
          "bg-muted text-muted-foreground"
        }`}>
          {perm === "unsupported" ? "Unsupported" : granted ? "On" : perm === "denied" ? "Blocked" : "Off"}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Get alerts when funds lock, codes are needed, or transfers are released. Native iOS & Android push coming soon.
      </p>

      {!granted && perm !== "unsupported" && (
        <Button onClick={enable} disabled={requesting || perm === "denied"} className="mt-4 w-full h-11 rounded-xl">
          {requesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
          {perm === "denied" ? "Blocked in browser" : "Enable browser alerts"}
        </Button>
      )}

      <ul className="mt-4 space-y-3">
        <ToggleRow label="Locked payments" hint="When a transfer is locked in escrow"
          checked={prefs.lockedAlerts} onChange={(v) => update("lockedAlerts", v)} disabled={!granted} />
        <ToggleRow label="Released funds" hint="When the recipient unlocks the payment"
          checked={prefs.releasedAlerts} onChange={(v) => update("releasedAlerts", v)} disabled={!granted} />
        <ToggleRow label="Expiring soon" hint="One hour before auto-refund"
          checked={prefs.expiringAlerts} onChange={(v) => update("expiringAlerts", v)} disabled={!granted} />
      </ul>
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange, disabled }: {
  label: string; hint: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </li>
  );
}
