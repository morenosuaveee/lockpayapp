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
  const feeInCents = Number(session.metadata?.feeInCents ?? 0);
  const sb = getSupabase();

  const { data: txn } = await sb
    .from("transactions")
    .update({
      status: "locked",
      stripe_payment_intent: paymentIntent ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .eq("status", "pending_payment")
    .select("id, sender_id")
    .maybeSingle();

  if (txn && feeInCents > 0) {
    const { error: feeErr } = await sb.from("platform_fees").upsert({
      transaction_id: transactionId,
      sender_id: txn.sender_id,
      amount: feeInCents / 100,
      currency: "USD",
      stripe_payment_intent: paymentIntent ?? null,
    }, { onConflict: "transaction_id" });
    if (feeErr) console.error("platform_fees insert failed:", feeErr);
  }
  console.log(`Transaction ${transactionId} locked; fee=${feeInCents}c`);

  // Send SMS notification to recipient if identifier is a phone number
  try {
    const { data: full } = await sb
      .from("transactions")
      .select("recipient_identifier, amount, note")
      .eq("id", transactionId)
      .maybeSingle();
    if (full) await sendRecipientSms(full.recipient_identifier as string, Number(full.amount), (full.note as string) ?? null);
  } catch (e) {
    console.error("SMS notify failed:", e);
  }
}

function isPhone(id: string): boolean {
  // E.164-ish: optional +, 8-15 digits
  const cleaned = id.replace(/[\s\-()]/g, "");
  return /^\+?[1-9]\d{7,14}$/.test(cleaned);
}

function toE164(id: string): string {
  const cleaned = id.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  // Default to US country code if 10 digits
  if (/^\d{10}$/.test(cleaned)) return `+1${cleaned}`;
  return `+${cleaned}`;
}

async function sendRecipientSms(recipientIdentifier: string, amount: number, note: string | null) {
  if (!isPhone(recipientIdentifier)) {
    console.log("Recipient not a phone number; skipping SMS:", recipientIdentifier);
    return;
  }
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  const FROM = Deno.env.get("TWILIO_FROM_NUMBER");
  if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !FROM) {
    console.error("Twilio env not configured (LOVABLE_API_KEY/TWILIO_API_KEY/TWILIO_FROM_NUMBER)");
    return;
  }
  const to = toE164(recipientIdentifier);
  const body = `You have $${amount.toFixed(2)} waiting on LockPay${note ? ` (${note})` : ""}. Sign in and enter the unlock code from the sender to claim: ${Deno.env.get("SUPABASE_URL")?.includes("localhost") ? "http://localhost:8080" : "https://code-lock-pay.lovable.app"}`;

  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: FROM, Body: body }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`Twilio error [${res.status}]:`, data);
    return;
  }
  console.log("SMS sent, sid:", data.sid);
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
