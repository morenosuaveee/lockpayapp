import { LegalPage } from "@/components/layout/LegalPage";
import { SUPPORT_EMAIL } from "@/components/layout/LegalFooter";

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="May 14, 2026">
      <p>
        Lock Pay ("Lock Pay", "we", "us") operates a technology platform for secure transfer
        coordination and recipient verification. This Privacy Policy explains what information we
        collect, how we use it, and the choices you have.
      </p>

      <h2>Information collected</h2>
      <p>
        We collect information you provide directly, information generated as you use Lock Pay,
        and information from service providers who help us operate the platform.
      </p>

      <h2>Account and profile data</h2>
      <ul>
        <li>Name, email address, and phone number.</li>
        <li>Authentication credentials and account preferences.</li>
        <li>Profile details you choose to add (display name, avatar).</li>
      </ul>

      <h2>SMS verification usage</h2>
      <p>
        We use your phone number to send one-time verification codes, login authentication codes,
        payment notifications, transaction confirmations, and security alerts. See our{" "}
        <a href="/sms-policy">SMS Communication Policy</a> for full details. We never sell or share
        SMS consent data for marketing purposes.
      </p>

      <h2>Device and browser information</h2>
      <ul>
        <li>Device identifiers, operating system, and app version.</li>
        <li>Browser type, IP address, and approximate location derived from network.</li>
        <li>Push notification tokens and basic technical/diagnostic logs.</li>
      </ul>

      <h2>Transaction-related information</h2>
      <ul>
        <li>Payment amounts, counterparties, agreement details, and release status.</li>
        <li>Card details handled exclusively by our PCI-certified payment processor (Stripe). Lock Pay never stores raw card numbers.</li>
        <li>Records of confirmations entered by both parties for dual-confirmation release.</li>
      </ul>

      <h2>Security and fraud prevention</h2>
      <p>
        We process account and transaction signals to detect fraud, abuse, account takeover, and
        unauthorized access. This may include device fingerprinting, velocity checks, and risk
        scoring across the dual-confirmation flow.
      </p>

      <h2>Third-party service providers</h2>
      <p>
        We share data only with the providers required to operate Lock Pay — payment processing
        (Stripe), SMS delivery, push notification infrastructure, hosting, and analytics. These
        providers are contractually bound to protect your information and use it only to deliver
        services to Lock Pay.
      </p>

      <h2>Data retention</h2>
      <p>
        We retain account information for the life of your account and for as long as required to
        meet financial-services and tax obligations. Transactional records may be retained longer
        where mandated by law.
      </p>

      <h2>User rights and account management</h2>
      <ul>
        <li>Access, correct, or export your personal information at any time.</li>
        <li>Request deletion of your account from Profile → Delete Account. We process verified deletion requests within 7 days, subject to regulatory retention.</li>
        <li>Opt out of SMS by replying STOP to any message; opt out of email marketing via the unsubscribe link.</li>
      </ul>

      <h2>Contact information</h2>
      <p>
        Questions about this policy? Email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or visit{" "}
        <a href="/contact">getlockpay.com/contact</a>.
      </p>
    </LegalPage>
  );
}
