// Sends Expo push notifications. Invoked from other edge functions or the client.
// Body: { user_ids?: string[], tokens?: string[], title: string, body: string, data?: any }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EXPO_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_ids, tokens, title, body, data } = await req.json();

    if (!title || !body) {
      return new Response(JSON.stringify({ error: "title and body required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let pushTokens: string[] = Array.isArray(tokens) ? tokens.filter(Boolean) : [];

    if (Array.isArray(user_ids) && user_ids.length > 0) {
      const { data: profs, error } = await supabase
        .from("profiles")
        .select("expo_push_token")
        .in("id", user_ids)
        .not("expo_push_token", "is", null);
      if (error) throw error;
      pushTokens.push(...(profs ?? []).map((p: any) => p.expo_push_token).filter(Boolean));
    }

    pushTokens = [...new Set(pushTokens)].filter((t) =>
      typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
    );

    if (pushTokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = pushTokens.map((to) => ({
      to,
      title,
      body,
      data: data ?? {},
      sound: "default",
      priority: "high",
    }));

    const res = await fetch(EXPO_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
    const result = await res.json();

    return new Response(JSON.stringify({ sent: pushTokens.length, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-push error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
