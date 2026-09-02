import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyWebhook } from "../_shared/stripe.ts";

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

  // ACH / bank debits complete the session before funds settle (payment_status
  // is "unpaid" until the debit clears, typically 3-5 business days). Hold the
  // transfer in "pending" and only lock it once payment_intent.succeeded lands.
  if (session.payment_status && session.payment_status !== "paid") {
    const sb = getSupabase();
    await sb
      .from("transactions")
      .update({
        status: "pending",
        stripe_payment_intent: paymentIntent ?? null,
        // Bank debits can take up to 5 business days; keep the transfer alive
        // well past the standard 48h card window so it isn't auto-expired.
        expires_at: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)
      .eq("status", "pending_payment");
    console.log(`Transaction ${transactionId} awaiting bank settlement (payment_status=${session.payment_status})`);
    return;
  }

  await lockTransaction(transactionId, paymentIntent ?? null, feeInCents);
}

/** Fired when a delayed (ACH) payment intent finally settles. */
async function handlePaymentIntentSucceeded(pi: any) {
  const transactionId = pi.metadata?.transactionId;
  if (!transactionId) {
    console.warn("payment_intent.succeeded without transactionId metadata");
    return;
  }
  await lockTransaction(transactionId, pi.id, Number(pi.metadata?.feeInCents ?? 0));
}

async function lockTransaction(transactionId: string, paymentIntent: string | null, feeInCents: number) {
  const sb = getSupabase();

  const { data: txn } = await sb
    .from("transactions")
    .update({
      status: "locked",
      stripe_payment_intent: paymentIntent ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .in("status", ["pending_payment", "pending"])
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

      // SMS: prefer the recipient identifier if it looks like a phone (any format),
      // otherwise fall back to a phone on the recipient's profile.
      const smsTarget = toE164(recipId) ?? (recipientPhone ? toE164(recipientPhone) : null);
      console.log("SMS target resolution:", { recipId, recipientPhone, smsTarget });
      if (smsTarget) {
        await sendRecipientSms(transactionId, smsTarget, amt, senderName);
      } else {
        console.log("No SMS target resolved for transaction", transactionId);
      }
      // Push notification to recipient if they have an account + Expo token
      if (rp?.id) {
        await sendPush(
          [rp.id as string],
          "Payment received 🔒",
          `${senderName ?? "Someone"} sent you $${amt.toFixed(2)} (locked). Tap to unlock.`,
          { transactionId, type: "payment_received" },
        );
      }
    }
  } catch (e) {
    console.error("Notify failed:", e);
  }
}

function isE164(s: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(s.trim());
}

// Try to coerce common phone formats into E.164. Returns null if not phone-like.
function toE164(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (isE164(s)) return s;
  // Strip everything except digits and leading +
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return null;
  // US/Canada 10-digit
  if (digits.length === 10) return `+1${digits}`;
  // 11-digit starting with 1
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  // Already has country code (7-15 digits) — best-effort
  if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
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

async function sendPush(userIds: string[], title: string, body: string, data: Record<string, unknown> = {}) {
  try {
    const sb = getSupabase();
    await sb.functions.invoke("send-push", {
      body: { user_ids: userIds, title, body, data },
    });
  } catch (e) {
    console.error("send-push invoke failed", e);
  }
}

async function handlePaymentFailed(intent: any) {
  const transactionId = intent.metadata?.transactionId;
  if (!transactionId) return;
  const sb = getSupabase();
  const { data: tx } = await sb
    .from("transactions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", transactionId)
    .eq("status", "pending_payment")
    .select("id, sender_id, amount")
    .maybeSingle();
  if (tx?.sender_id) {
    await sendPush(
      [tx.sender_id as string],
      "Payment cancelled",
      `Your $${Number(tx.amount).toFixed(2)} payment could not be completed.`,
      { transactionId, type: "payment_cancelled" },
    );
  }
}

async function handleWebhook(req: Request) {
  const event = await verifyWebhook(req);
  console.log("Stripe event:", event.type);

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "transaction.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    case "checkout.session.async_payment_failed":
      await handlePaymentFailed(event.data.object);
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
  try {
    await handleWebhook(req);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});

