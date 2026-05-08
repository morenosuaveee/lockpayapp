import { useEffect, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * ExpoPushTokenCard
 * Saves an Expo push token (e.g. `ExponentPushToken[xxx]`) onto the user's profile
 * so the backend can deliver native push notifications via the Expo Push API.
 *
 * In an Expo/React Native shell, the host app should call:
 *   const token = (await Notifications.getExpoPushTokenAsync()).data
 *   bridge.postMessage({ type: "expo-push-token", token })
 * The web layer can then auto-save it. This card also allows manual entry for testing.
 */
export function ExpoPushTokenCard({ userId }: { userId: string }) {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("expo_push_token")
        .eq("id", userId)
        .maybeSingle();
      if (!cancelled) {
        setSaved(data?.expo_push_token ?? null);
        setToken(data?.expo_push_token ?? "");
        setLoading(false);
      }
    })();

    // Allow a native shell (React Native WebView) to push the token in.
    function onMsg(e: MessageEvent) {
      const data = typeof e.data === "string" ? safeParse(e.data) : e.data;
      if (data?.type === "expo-push-token" && typeof data.token === "string") {
        setToken(data.token);
        save(data.token);
      }
    }
    window.addEventListener("message", onMsg);
    return () => {
      cancelled = true;
      window.removeEventListener("message", onMsg);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function save(t: string) {
    const value = t.trim();
    if (!value.startsWith("ExponentPushToken[") && !value.startsWith("ExpoPushToken[")) {
      toast.error("Token must look like ExponentPushToken[xxxxx]");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ expo_push_token: value })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error("Could not save token");
      return;
    }
    setSaved(value);
    toast.success("Push notifications enabled");
  }

  async function clear() {
    setSaving(true);
    await supabase.from("profiles").update({ expo_push_token: null }).eq("id", userId);
    setSaving(false);
    setSaved(null);
    setToken("");
    toast.success("Push notifications disabled");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Push notifications</h3>
          <p className="text-xs text-muted-foreground">
            Get alerts when payments are received, unlocked, or cancelled.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="expo-token" className="text-xs">Expo push token</Label>
        <Input
          id="expo-token"
          placeholder="ExponentPushToken[...]"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          disabled={loading || saving}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {saved && (
          <p className="flex items-center gap-1 text-[11px] text-emerald-600">
            <Check className="h-3 w-3" /> Token saved
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          onClick={() => save(token)}
          disabled={saving || loading || !token.trim() || token === saved}
          className="flex-1"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save token"}
        </Button>
        {saved && (
          <Button variant="outline" onClick={clear} disabled={saving}>
            Disable
          </Button>
        )}
      </div>
    </div>
  );
}

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}
