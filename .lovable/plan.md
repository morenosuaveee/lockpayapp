## LockPay Premium Refinement Sprint

A focused, multi-pass polish across onboarding, transfer lifecycle, recipient verification, native feel, and trust layer. Scope is frontend/UX with light additive backend (no schema changes — existing tables already cover all states).

---

### 1. Onboarding progress system + verified success

- Add a reusable `<OnboardingProgress />` (3 steps: Create account · Verify identity · Secure transfer ready) used on `/auth`, `/onboarding`, post-verify.
- After phone/email verification: full-screen "Verified" state with `SuccessMark` ring burst, haptic tap (`native.ts`), trust copy ("Your account is secured. Transfers are now protected by LockPay.") → smooth fade into `/dashboard`.
- Refine `Auth.tsx` spacing, button press states, skeleton on OTP send, calmer micro-copy.

### 2. Transfer lifecycle polish

- Refresh `StatusBadge` mapping for all 7 states (Drafted/Pending recipient/Recipient verified/Payment ready/Completed/Expired/Cancelled) with consistent color + icon language.
- Add `<TransferTimeline />` component on `UnlockTransaction.tsx` showing chronological events (created → invite sent → recipient confirmed → payment → released) with timestamps.
- Polished empty + loading states already partly exist on Transactions; extend the same shimmer pattern to Dashboard recent activity and Unlock page.
- Realtime: subscribe to single-tx changes on `UnlockTransaction` for live state flips.

### 3. Recipient verification UX

- New `<RecipientLookup />` component used inside `SendMoney.tsx`: debounced call to existing `lookup_recipient` RPC.
- Three visual states with trust styling:
  - Verified LockPay user → mint avatar with initials, "Verified LockPay recipient · Identity confirmed"
  - Exists but unverified → amber dot, "Unverified recipient · invite required"
  - Not found → outline, "Recipient will receive a secure invite"
- Reassurance line beneath: "Your money is protected before payment is released."

### 4. Native iOS feel

- AppShell: enhance with backdrop-blur top bar slot, smoother page transitions (already uses `page-enter`).
- BottomNav: spring-press feedback, active pill animation, hide-on-keyboard.
- Add haptic taps on all primary CTAs via `native.ts` `haptic()` helper.
- Sticky CTA pattern + safe-area aware on Send/Unlock.
- Native skeletons (already have `skeleton-shimmer`) extended to all data screens.
- Remove any remaining desktop-style max-widths on inner content; tighten 4/8/12 spacing rhythm.

### 5. Trust & security layer

- Audit existing `/security`, `/how-it-works`, `/contact`, `/compliance` pages — tighten copy and add cross-links.
- Add a "How LockPay Protects You" panel to Dashboard (collapsible) and a trust strip under the Send form.
- Footer + Profile links to Security Center, FAQ (extend HowItWorks), Support, Compliance.

---

### Technical notes

- No DB migrations needed — all states already exist in `transaction_status` enum.
- New components: `OnboardingProgress`, `VerifiedSuccess`, `TransferTimeline`, `RecipientLookup`, `TrustPanel`.
- Reuse: `SuccessMark`, `StatusBadge`, `TrustStrip`, `native.haptic`, `skeleton-shimmer`.
- All colors via existing semantic tokens (`accent`, `lock`, `primary`, `destructive-soft`).
- No breaking changes to routes or backend contracts.

### Out of scope

- New auth providers, schema changes, payment provider swap, or AI features.
- Capacitor native plugin additions beyond what `native.ts` already wraps.
