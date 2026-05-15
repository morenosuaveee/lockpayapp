## Overview

Add a complete invite-and-claim system so a sender can transfer to anyone, even non-LockPay users. Charge happens only after the recipient verifies and confirms the 4-digit code. Wire this through DB, edge functions, email/SMS delivery, claim page, sender notifications, and Activity badges.

## Phase 1 — Database (single migration)

1. Extend `transaction_status` enum with `pending_invite`, `awaiting_recipient`, `recipient_confirmed`.
2. Add columns on `transactions`:
   - `claim_token text unique` (random URL-safe token)
   - `recipient_channel text` (`'email' | 'phone'`)
   - `invite_sent_at timestamptz`
   - `recipient_confirmed_at timestamptz`
3. Index on `claim_token`.
4. New RLS policy: anonymous users can `select` a transaction by exact `claim_token` match (returns sanitized fields only via a SECURITY DEFINER `claim_lookup(token)` RPC — RLS still blocks raw table access).
5. New SECURITY DEFINER RPC `recipient_confirm_claim(_token, _code, _user_id)` — verifies code hash, marks `recipient_confirmed`, links `recipient_id`.
6. RPC `mark_invite_pending_payment(_txn_id)` — sender-side, transitions `recipient_confirmed → pending_payment`.

## Phase 2 — Email + SMS infrastructure

1. Run email infra setup (creates pgmq queues, `process-email-queue`, suppression tables).
2. Scaffold transactional email functions.
3. Create one template: `transfer-invite` (sender name, amount, claim URL, branded LockPay styling, no code in the email — code is shared off-app).
4. Reuse existing `send-telnyx-sms` function for SMS invites.
5. New edge function `send-transfer-invite`:
   - Auth-gated (sender's JWT)
   - Looks up recipient: `profiles.paypal_email` or `profiles.phone` match
   - If found → returns `{ existing: true, recipient_id }` (caller uses normal flow)
   - If not found → generates `claim_token`, updates txn (`status=pending_invite`, `claim_token`, `recipient_channel`, `invite_sent_at`), and dispatches SMS or email containing the claim URL `https://getlockpay.com/claim/<token>`

## Phase 3 — Sender flow (SendMoney rewrite)

Step changes:
1. **Details** — debounced recipient lookup (calls a lightweight `recipient-lookup` edge function or RPC). Show one of three inline states under the input:
   - ✓ "LockPay user" (verified chip)
   - ⓘ "New to LockPay — they'll get an invite"
   - (typing / loading)
2. **Code** — same as today.
3. **Send** — branches based on lookup:
   - **Existing user:** unchanged → goes to Stripe checkout.
   - **New recipient:** insert txn with `status=pending_invite`, call `send-transfer-invite`, then route to a new "Invite sent" success screen (no Stripe yet). Sender sees: "Invite sent to <recipient> · Awaiting confirmation". Live realtime status badge.
4. **Pay-after-confirm bridge:** when txn flips to `recipient_confirmed`, sender sees a push-style banner on Home + Activity row CTA: "Complete payment". Tapping opens existing `LockPayCheckout`. After Stripe success, normal locked → completed flow continues.

## Phase 4 — Recipient claim flow (new public route `/claim/:token`)

1. Public page (no auth required to land).
2. Loads sanitized txn details via `claim_lookup` RPC: sender display name, amount, currency, sender note, expires_at.
3. If recipient is logged out → minimal signup: email OR phone (matches `recipient_channel`) + password. After signup, auto-verify the channel they were invited on (already verified by virtue of receiving the invite at that address; for phone invites we still require Twilio Verify OTP — consistent with current `phone-verify-start/check`). For email invites, reuse Supabase email verification.
4. Logged in → claim card with: sender + amount summary → "Enter 4-digit confirmation code" → `recipient_confirm_claim` RPC.
5. Success → "Recipient confirmed. The sender will complete payment shortly." Polling/realtime to show status updates.

## Phase 5 — Activity + status surfaces

1. Update `StatusBadge` to render: Pending invite, Awaiting recipient, Recipient confirmed, Pending payment, Locked, Completed, Expired, Refunded — each with distinct color + icon.
2. Activity page: filter chips updated to All / Invites / Pending / Completed / Expired.
3. Each row shows recipient, amount, relative timestamp, status badge, and an action chip when sender action is needed ("Complete payment", "Resend invite").
4. Dashboard "Recent activity" gets an inline call-out card when any txn is `recipient_confirmed` and awaiting sender payment.

## Phase 6 — Native polish pass

1. Tighten transitions on step changes (already added `animate-fade-in`).
2. Add iOS-style sheet for "Resend invite" / "Cancel transfer" actions on a transfer detail screen.
3. Ensure all new screens use `pt-safe`, sticky CTA pattern, and `active:scale-[0.98]` micro-interactions.
4. Add success animation (`SuccessMark`) on claim confirm and on sender payment complete.

## Out of scope (will not do unless asked)

- Push notifications (already partially wired via `expo_push_token`; can extend later).
- Identity verification (KYC) for invited users beyond channel verification.
- Multi-recipient / split transfers.

## Technical notes

- `claim_token`: 24 bytes, base64url, generated server-side.
- All new RPCs: `SECURITY DEFINER`, `SET search_path = public`.
- Realtime: enable `transactions` on the supabase publication if not already (Dashboard already subscribes to `postgres_changes`).
- Idempotency on `send-transfer-invite`: only sends once per `claim_token` unless explicit `resend=true`.
- `recipient_identifier` is normalized (lowercased email, E.164 phone) before lookup.

```text
Sender                           Recipient
------                           ---------
[Send] enter recipient
   │ debounced lookup
   ▼
not a user?
   │ create txn(status=pending_invite, claim_token)
   │ send-transfer-invite (SMS or email)
   ▼
[Invite sent] ─────────────►  receives SMS / email
                                 │ taps link
                                 ▼
                              /claim/<token>
                                 │ minimal signup
                                 │ enter 4-digit code
                                 ▼
                              status=recipient_confirmed
   ◄─── realtime push ─────
[Complete payment] (Stripe)
   │
   ▼
status=locked → completed
```

If you approve this plan, I'll execute Phase 1 first (DB migration), then proceed phase by phase.