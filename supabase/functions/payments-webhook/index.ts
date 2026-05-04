import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

async function handleCheckoutCompleted(session: any) {
  const transactionId = session.metadata?.transactionId;
  if (!transactionId) {
    console.warn("checkout.session.completed without transactionId metadata");
    return;
  }
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  await getSupabase()
    .from("transactions")
    .update({
      status: "locked",
      stripe_payment_intent: paymentIntent ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .eq("status", "pending_payment");
  console.log(`Transaction ${transactionId} locked after successful payment`);
}

async function handlePaymentFailed(intent: any) {
  const transactionId = intent.metadata?.transactionId;
  if (!transactionId) return;
  await getSupabase()
    .from("transactions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", transactionId)
    .eq("status", "pending_payment");
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  console.log("Stripe event:", event.type);

  switch (event.type) {
    case "checkout.session.completed":
    case "transaction.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "payment_intent.payment_failed":
    case "transaction.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook missing env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handleWebhook(req, rawEnv as StripeEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
