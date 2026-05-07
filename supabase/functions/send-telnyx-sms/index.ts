// Send SMS via Telnyx Messaging API
// Public function: called by other edge functions (payments-webhook) using service role.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendBody {
  to: string;       // E.164, e.g. +15551234567
  text: string;
}

function isE164(s: string) {
  return /^\+[1-9]\d{6,14}$/.test(s.trim());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("TELNYX_API_KEY");
    const profileId = Deno.env.get("TELNYX_MESSAGING_PROFILE_ID");
    const from = Deno.env.get("TELNYX_FROM_NUMBER");
    if (!apiKey) throw new Error("TELNYX_API_KEY not configured");
    if (!from) throw new Error("TELNYX_FROM_NUMBER not configured");

    const body = (await req.json()) as SendBody;
    if (!body?.to || !isE164(body.to)) throw new Error("Invalid 'to' (must be E.164, e.g. +15551234567)");
    if (!body?.text || typeof body.text !== "string" || body.text.length === 0 || body.text.length > 1600) {
      throw new Error("Invalid 'text' (1-1600 chars)");
    }

    const payload: Record<string, unknown> = {
      from,
      to: body.to.trim(),
      text: body.text,
    };
    if (profileId) payload.messaging_profile_id = profileId;

    const res = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Telnyx error:", res.status, data);
      throw new Error(`Telnyx send failed [${res.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, id: data?.data?.id ?? null }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("send-telnyx-sms error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
