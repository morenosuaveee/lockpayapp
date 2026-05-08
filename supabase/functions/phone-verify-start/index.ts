// Sends a Twilio Verify SMS code to a phone number for the authenticated user.
// Requires secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const E164 = /^\+[1-9]\d{7,14}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(supabaseUrl, anon, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: userErr } = await sb.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const { phone } = await req.json().catch(() => ({}));
    if (!phone || !E164.test(String(phone).trim())) {
      return json({ error: "Use international format, e.g. +14155551234" }, 400);
    }

    const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const token = Deno.env.get("TWILIO_AUTH_TOKEN");
    const service = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");
    if (!sid || !token || !service) {
      return json({ error: "Twilio Verify is not configured" }, 500);
    }

    const basic = btoa(`${sid}:${token}`);
    const res = await fetch(`https://verify.twilio.com/v2/Services/${service}/Verifications`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: String(phone).trim(), Channel: "sms" }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Twilio Verify start error", data);
      return json({ error: data?.message ?? "Could not send code" }, res.status);
    }

    return json({ status: data.status, sent: true });
  } catch (e) {
    console.error("phone-verify-start error", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
