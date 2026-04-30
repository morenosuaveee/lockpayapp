// Payment provider abstraction.
// MockPayPal simulates escrow behavior. Real PayPal/Venmo/bank can implement this later.

export type PaymentProviderId = "paypal" | "venmo" | "bank";

export interface InitiatePaymentArgs {
  amount: number;
  currency: string;
  senderAccount: string; // e.g. PayPal email
  recipientAccount: string;
  reference: string; // transaction id
}

export interface InitiatePaymentResult {
  success: boolean;
  providerRef: string;
  message: string;
}

export interface ReleasePaymentArgs {
  providerRef: string;
  recipientAccount: string;
  amount: number;
}

export interface PaymentProvider {
  id: PaymentProviderId;
  name: string;
  /** Lock/escrow funds — money debited from sender, held by app */
  initiatePayment(args: InitiatePaymentArgs): Promise<InitiatePaymentResult>;
  /** Release escrowed funds to recipient */
  releasePayment(args: ReleasePaymentArgs): Promise<{ success: boolean; message: string }>;
  /** Refund expired/cancelled txn back to sender */
  refundPayment(args: { providerRef: string; senderAccount: string; amount: number }): Promise<{ success: boolean }>;
}

// ── MOCK PAYPAL ─────────────────────────────────────────────────────────────
const fakeLatency = (ms = 600) => new Promise((r) => setTimeout(r, ms));

export const MockPayPalProvider: PaymentProvider = {
  id: "paypal",
  name: "PayPal",
  async initiatePayment({ reference }) {
    await fakeLatency();
    return {
      success: true,
      providerRef: `PP-MOCK-${reference.slice(0, 8).toUpperCase()}`,
      message: "Funds held in LockPay escrow (mock PayPal sandbox).",
    };
  },
  async releasePayment() {
    await fakeLatency(450);
    return { success: true, message: "Funds released to recipient (mock)." };
  },
  async refundPayment() {
    await fakeLatency(450);
    return { success: true };
  },
};

// Registry — add real providers here later
export const paymentProviders: Record<PaymentProviderId, PaymentProvider> = {
  paypal: MockPayPalProvider,
  // venmo: RealVenmoProvider,
  // bank: BankTransferProvider,
} as Record<PaymentProviderId, PaymentProvider>;

export function getProvider(id: PaymentProviderId): PaymentProvider {
  const p = paymentProviders[id];
  if (!p) throw new Error(`Payment provider "${id}" not configured yet.`);
  return p;
}
