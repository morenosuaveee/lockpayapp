// Public endpoint: sends a Twilio Verify SMS code for phone login (no auth required).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const E164 = /^\+[1-9]\d{7,14}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { phone } = await req.json().catch(() => ({}));
    const phoneStr = String(phone ?? "").trim();
    if (!E164.test(phoneStr)) return json({ error: "Use international format, e.g. +14155551234" }, 400);

    const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const token = Deno.env.get("TWILIO_AUTH_TOKEN");
    const service = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");
    if (!sid || !token || !service) return json({ error: "Twilio Verify is not configured" }, 500);

    const basic = btoa(`${sid}:${token}`);
    const res = await fetch(`https://verify.twilio.com/v2/Services/${service}/Verifications`, {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: phoneStr, Channel: "sms" }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Twilio Verify start error", data);
      return json({ error: data?.message ?? "Could not send code" }, res.status);
    }
    return json({ sent: true, status: data.status });
  } catch (e) {
    console.error("phone-login-start error", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
