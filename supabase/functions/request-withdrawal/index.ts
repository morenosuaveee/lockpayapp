import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let withdrawalId: string | null = null;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData.user) throw new Error("Unauthorized");
    const user = userData.user;

    const { amount } = (await req.json()) as { amount?: number };
    const cents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(cents) || cents < 100) throw new Error("Minimum withdrawal is $1.00");

    // Balance = sum of ledger entries
    const { data: entries, error: ledErr } = await supabase
      .from("wallet_ledger")
      .select("amount")
      .eq("user_id", user.id);
    if (ledErr) throw new Error(ledErr.message);
    const balanceCents = Math.round(
      (entries ?? []).reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0) * 100,
    );
    if (cents > balanceCents) throw new Error("Amount exceeds your available balance");

    const { data: acct } = await supabase
      .from("payout_accounts")
      .select("stripe_account_id, payouts_enabled")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!acct?.stripe_account_id) throw new Error("Connect a payout account first");
    if (!acct.payouts_enabled) throw new Error("Your payout account still needs verification");

    // Record the withdrawal + debit the ledger before moving money.
    const { data: wd, error: wdErr } = await supabase
      .from("withdrawals")
      .insert({
        user_id: user.id,
        amount: cents / 100,
        status: "pending",
        stripe_account_id: acct.stripe_account_id,
      })
      .select("id")
      .single();
    if (wdErr) throw new Error(wdErr.message);
    withdrawalId = wd.id;

    const { error: debitErr } = await supabase.from("wallet_ledger").insert({
      user_id: user.id,
      withdrawal_id: withdrawalId,
      kind: "withdrawal_debit",
      amount: -(cents / 100),
      description: "Withdrawal to bank account",
    });
    if (debitErr) throw new Error(debitErr.message);

    const stripe = createStripeClient();
    const transfer = await stripe.transfers.create(
      {
        amount: cents,
        currency: "usd",
        destination: acct.stripe_account_id,
        description: "LockPay withdrawal",
        metadata: { userId: user.id, withdrawalId: withdrawalId! },
      },
      { idempotencyKey: `lockpay-withdrawal-${withdrawalId}` },
    );

    await supabase
      .from("withdrawals")
      .update({ status: "paid", stripe_transfer_id: transfer.id })
      .eq("id", withdrawalId);

    return json({ ok: true, withdrawalId, amount: cents / 100 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("request-withdrawal error:", msg);
    if (withdrawalId) {
      // Roll back: mark failed and reverse the debit if it landed.
      await supabase.from("withdrawals").update({ status: "failed", failure_reason: msg }).eq("id", withdrawalId);
      const { data: debit } = await supabase
        .from("wallet_ledger")
        .select("id, amount")
        .eq("withdrawal_id", withdrawalId)
        .eq("kind", "withdrawal_debit")
        .maybeSingle();
      if (debit) {
        await supabase.from("wallet_ledger").insert({
          user_id: (await supabase.from("withdrawals").select("user_id").eq("id", withdrawalId).single()).data!.user_id,
          withdrawal_id: withdrawalId,
          kind: "withdrawal_reversal",
          amount: Math.abs(Number(debit.amount)),
          description: "Withdrawal failed — funds returned",
        });
      }
    }
    return json({ error: msg }, 400);
  }
});
