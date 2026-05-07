// Diagnostic: fetch a Telnyx message by id to see delivery status (DLR)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) throw new Error("missing ?id=");
    const apiKey = Deno.env.get("TELNYX_API_KEY")!;
    const res = await fetch(`https://api.telnyx.com/v2/messages/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    return new Response(JSON.stringify(data, null, 2), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
