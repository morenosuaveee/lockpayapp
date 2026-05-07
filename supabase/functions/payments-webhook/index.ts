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

  // Send email notification to recipient if identifier is an email
  try {
    const { data: full } = await sb
      .from("transactions")
      .select("recipient_identifier, amount, note, sender_id")
      .eq("id", transactionId)
      .maybeSingle();
    if (full) {
      let senderName: string | null = null;
      let recipientName: string | null = null;
      let recipientPhone: string | null = null;
      if (full.sender_id) {
        const { data: sp } = await sb.from("profiles").select("display_name").eq("id", full.sender_id).maybeSingle();
        senderName = (sp?.display_name as string) ?? null;
      }
      const recipId = String(full.recipient_identifier);
      // Try to find recipient profile by email or phone
      const { data: rp } = await sb
        .from("profiles")
        .select("display_name, id, phone, paypal_email")
        .or(`paypal_email.eq.${recipId.toLowerCase()},phone.eq.${recipId}`)
        .maybeSingle();
      recipientName = (rp?.display_name as string) ?? null;
      recipientPhone = (rp?.phone as string) ?? null;

      const amt = Number(full.amount);
      const note = (full.note as string) ?? null;

      await sendRecipientEmail(transactionId, recipId, amt, note, senderName, recipientName);

      // SMS: if recipient identifier itself is a phone, OR profile has a phone
      const smsTarget = isE164(recipId) ? recipId : (recipientPhone && isE164(recipientPhone) ? recipientPhone : null);
      if (smsTarget) {
        await sendRecipientSms(transactionId, smsTarget, amt, senderName);
      }
    }
  } catch (e) {
    console.error("Notify failed:", e);
  }
}

function isE164(s: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(s.trim());
}

async function sendRecipientSms(transactionId: string, toPhone: string, amount: number, senderName: string | null) {
  const appUrl = Deno.env.get("APP_URL") ?? "https://lockpayapp.lovable.app";
  const claimUrl = `${appUrl}/transactions/${transactionId}`;
  const who = senderName ? senderName : "Someone";
  const text = `LockPay: ${who} sent you $${amount.toFixed(2)} (locked in escrow). Claim it: ${claimUrl}\nReply STOP to opt out.`;
  const sb = getSupabase();
  const { error } = await sb.functions.invoke("send-telnyx-sms", {
    body: { to: toPhone, text },
  });
  if (error) console.error("send-telnyx-sms error:", error);
  else console.log("Telnyx SMS enqueued for", toPhone);
}

function isEmail(id: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id.trim());
}

async function sendRecipientEmail(transactionId: string, recipientIdentifier: string, amount: number, note: string | null, senderName: string | null, recipientName: string | null) {
  if (!isEmail(recipientIdentifier)) {
    console.log("Recipient not an email; skipping notification:", recipientIdentifier);
    return;
  }
  const sb = getSupabase();
  const { error } = await sb.functions.invoke("send-transactional-email", {
    body: {
      templateName: "payment-waiting",
      recipientEmail: recipientIdentifier.trim().toLowerCase(),
      idempotencyKey: `payment-waiting-${transactionId}`,
      templateData: { amount, note, senderName, recipientName },
    },
  });
  if (error) console.error("send-transactional-email error:", error);
  else console.log("Payment-waiting email enqueued for", recipientIdentifier);
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
