// LockPay service fee: 1% of transfer amount, minimum $0.50.
// Tweak these constants to change pricing globally.

export const FEE_RATE = 0.01;
export const FEE_MIN_CENTS = 50;

export function calcFeeCents(amountCents: number): number {
  if (amountCents <= 0) return 0;
  return Math.max(FEE_MIN_CENTS, Math.round(amountCents * FEE_RATE));
}

export function calcFeeDollars(amountDollars: number): number {
  return calcFeeCents(Math.round(amountDollars * 100)) / 100;
}
