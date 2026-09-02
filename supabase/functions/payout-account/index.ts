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

    const { action, returnUrl } = (await req.json().catch(() => ({}))) as {
      action?: "status" | "onboard" | "dashboard";
      returnUrl?: string;
    };
    const stripe = createStripeClient();

    const { data: existing } = await supabase
      .from("payout_accounts")
      .select("stripe_account_id, payouts_enabled, details_submitted")
      .eq("user_id", user.id)
      .maybeSingle();

    // Always refresh from Stripe when we have an account on file.
    let accountId = existing?.stripe_account_id ?? null;
    let payoutsEnabled = existing?.payouts_enabled ?? false;
    let detailsSubmitted = existing?.details_submitted ?? false;

    if (accountId) {
      const acct = await stripe.accounts.retrieve(accountId);
      payoutsEnabled = !!acct.payouts_enabled;
      detailsSubmitted = !!acct.details_submitted;
      await supabase
        .from("payout_accounts")
        .update({ payouts_enabled: payoutsEnabled, details_submitted: detailsSubmitted })
        .eq("user_id", user.id);
    }

    if (action === "status") {
      return json({ connected: !!accountId, payoutsEnabled, detailsSubmitted });
    }

    if (action === "dashboard") {
      if (!accountId) throw new Error("No payout account connected");
      const link = await stripe.accounts.createLoginLink(accountId);
      return json({ url: link.url });
    }

    // action === "onboard"
    if (!returnUrl) throw new Error("Missing returnUrl");

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email ?? undefined,
        capabilities: { transfers: { requested: true } },
        business_type: "individual",
        metadata: { userId: user.id },
      });
      accountId = account.id;
      const { error: insErr } = await supabase.from("payout_accounts").insert({
        user_id: user.id,
        stripe_account_id: accountId,
        payouts_enabled: !!account.payouts_enabled,
        details_submitted: !!account.details_submitted,
      });
      if (insErr) throw new Error(insErr.message);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return json({ url: accountLink.url, accountId });
  } catch (e) {
    console.error("payout-account error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 400);
  }
});
