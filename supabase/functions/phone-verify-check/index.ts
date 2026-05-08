// Checks a Twilio Verify SMS code. On success, marks the profile phone as verified.
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

    const { phone, code } = await req.json().catch(() => ({}));
    const phoneStr = String(phone ?? "").trim();
    const codeStr = String(code ?? "").trim();
    if (!E164.test(phoneStr)) return json({ error: "Invalid phone" }, 400);
    if (!/^\d{4,10}$/.test(codeStr)) return json({ error: "Invalid code" }, 400);

    const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const token = Deno.env.get("TWILIO_AUTH_TOKEN");
    const service = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");
    if (!sid || !token || !service) return json({ error: "Twilio Verify is not configured" }, 500);

    const basic = btoa(`${sid}:${token}`);
    const res = await fetch(`https://verify.twilio.com/v2/Services/${service}/VerificationCheck`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phoneStr, Code: codeStr }),
    });
    const data = await res.json();

    if (!res.ok) {
      console.error("Twilio Verify check error", data);
      return json({ error: data?.message ?? "Verification failed" }, res.status);
    }
    if (data.status !== "approved") {
      return json({ verified: false, status: data.status, error: "Incorrect code" }, 400);
    }

    // Persist verified phone using service role (bypass RLS for trusted update)
    const service_role = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, service_role);
    const { error: updErr } = await admin
      .from("profiles")
      .update({ phone: phoneStr, phone_verified_at: new Date().toISOString() })
      .eq("id", user.id);
    if (updErr) {
      console.error("profile update error", updErr);
      return json({ error: "Verified but could not save" }, 500);
    }

    return json({ verified: true });
  } catch (e) {
    console.error("phone-verify-check error", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
