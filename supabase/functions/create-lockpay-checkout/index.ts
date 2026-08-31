import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


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
    const { transactionId, amountInCents, feeInCents, recipient, returnUrl, environment } = body as {
      transactionId: string; amountInCents: number; feeInCents: number; recipient: string; returnUrl: string; environment: StripeEnv;
    };

    if (!transactionId || typeof transactionId !== "string") throw new Error("Invalid transactionId");
    if (!amountInCents || amountInCents < 50) throw new Error("Amount must be at least $0.50");
    if (typeof feeInCents !== "number" || feeInCents < 0) throw new Error("Invalid fee");
    if (!recipient || typeof recipient !== "string") throw new Error("Invalid recipient");
    if (!returnUrl || typeof returnUrl !== "string") throw new Error("Invalid returnUrl");
    void environment; // environment is derived from the connected Stripe key

    // Verify the txn belongs to this user and is pending
    const { data: txn, error: txnErr } = await supabase
      .from("transactions")
      .select("id, sender_id, status, amount")
      .eq("id", transactionId)
      .maybeSingle();
    if (txnErr || !txn) throw new Error("Transaction not found");
    if (txn.sender_id !== user.id) throw new Error("Forbidden");
    if (txn.status !== "pending_payment") throw new Error("Transaction not awaiting payment");

    const stripe = createStripeClient();

    const lineItems: any[] = [{
      price_data: {
        currency: "usd",
        product_data: { name: `LockPay transfer to ${recipient}`, description: "Funds held in LockPay escrow until dual-code unlock." },
        unit_amount: amountInCents,
      },
      quantity: 1,
    }];
    if (feeInCents > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "LockPay service fee", description: "1% of transfer (min $0.50)." },
          unit_amount: feeInCents,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      customer_email: user.email,
      metadata: { transactionId, userId: user.id, feeInCents: String(feeInCents) },
      payment_intent_data: { metadata: { transactionId, userId: user.id, feeInCents: String(feeInCents) } },
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
