import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData.user) throw new Error("Unauthorized");
    const user = userData.user;

    const body = await req.json();
    const { transactionId, amountInCents, recipient, returnUrl, environment } = body as {
      transactionId: string; amountInCents: number; recipient: string; returnUrl: string; environment: StripeEnv;
    };

    if (!transactionId || typeof transactionId !== "string") throw new Error("Invalid transactionId");
    if (!amountInCents || amountInCents < 50) throw new Error("Amount must be at least $0.50");
    if (!recipient || typeof recipient !== "string") throw new Error("Invalid recipient");
    if (!returnUrl || typeof returnUrl !== "string") throw new Error("Invalid returnUrl");
    if (environment !== "sandbox" && environment !== "live") throw new Error("Invalid environment");

    // Verify the txn belongs to this user and is pending
    const { data: txn, error: txnErr } = await supabase
      .from("transactions")
      .select("id, sender_id, status, amount")
      .eq("id", transactionId)
      .maybeSingle();
    if (txnErr || !txn) throw new Error("Transaction not found");
    if (txn.sender_id !== user.id) throw new Error("Forbidden");
    if (txn.status !== "pending_payment") throw new Error("Transaction not awaiting payment");

    const stripe = createStripeClient(environment);
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `LockPay transfer to ${recipient}`, description: "Funds held in LockPay escrow until dual-code unlock." },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      customer_email: user.email,
      metadata: { transactionId, userId: user.id },
      payment_intent_data: { metadata: { transactionId, userId: user.id } },
    });

    await supabase
      .from("transactions")
      .update({ stripe_session_id: session.id })
      .eq("id", transactionId);

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-lockpay-checkout error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
