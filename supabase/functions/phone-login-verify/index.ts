// Verifies a Twilio Verify SMS code. On success, ensures a Supabase auth user exists for the phone,
// resets a one-time password, and returns it so the client can complete signInWithPassword({phone, password}).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const E164 = /^\+[1-9]\d{7,14}$/;

function randomPassword() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/=/g, "") + "Aa1!";
}

async function findUserByPhone(admin: ReturnType<typeof createClient>, phone: string) {
  // Paginate up to 10 pages * 200 users = 2000. Sufficient for prototype scale.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.phone === phone || u.phone === phone.replace(/^\+/, ""));
    if (match) return match;
    if (data.users.length < 200) break;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
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
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: phoneStr, Code: codeStr }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Twilio Verify check error", data);
      return json({ error: data?.message ?? "Verification failed" }, res.status);
    }
    if (data.status !== "approved") {
      return json({ verified: false, error: "Incorrect code" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRole);

    const password = randomPassword();
    let userId: string | null = null;

    const existing = await findUserByPhone(admin, phoneStr);
    if (existing) {
      const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
        password,
        phone_confirm: true,
      });
      if (updErr) {
        console.error("updateUserById error", updErr);
        return json({ error: "Could not finalize sign-in" }, 500);
      }
      userId = existing.id;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        phone: phoneStr,
        password,
        phone_confirm: true,
        user_metadata: { display_name: null, signup_method: "phone_otp" },
      });
      if (createErr || !created.user) {
        console.error("createUser error", createErr);
        return json({ error: "Could not create account" }, 500);
      }
      userId = created.user.id;
      // Best-effort: ensure profile row exists with phone + verified timestamp
      await admin
        .from("profiles")
        .upsert(
          { id: userId, phone: phoneStr, phone_verified_at: new Date().toISOString() },
          { onConflict: "id" },
        );
    }

    // Mark phone as verified on profile (covers existing-user path too)
    await admin
      .from("profiles")
      .update({ phone: phoneStr, phone_verified_at: new Date().toISOString() })
      .eq("id", userId);

    // Fire-and-forget Expo push: OTP verified
    try {
      await admin.functions.invoke("send-push", {
        body: {
          user_ids: [userId],
          title: "Phone verified ✅",
          body: "Your phone number was verified successfully.",
          data: { type: "otp_verified" },
        },
      });
    } catch (e) {
      console.error("send-push (otp) failed", e);
    }

    return json({ verified: true, phone: phoneStr, password });
  } catch (e) {
    console.error("phone-login-verify error", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
