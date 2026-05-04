import { isTestMode } from "@/lib/stripe";

export function PaymentTestModeBanner() {
  if (!isTestMode()) return null;
  return (
    <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-xs text-orange-800">
      Test mode — use card <span className="font-mono font-semibold">4242 4242 4242 4242</span>, any future expiry & CVC.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium"
      >
        Learn more
      </a>
    </div>
  );
}
