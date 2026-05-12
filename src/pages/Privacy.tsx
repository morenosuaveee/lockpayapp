import { LegalPage } from "@/components/layout/LegalPage";
import { SUPPORT_EMAIL } from "@/components/layout/LegalFooter";

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="May 12, 2026">
      <p>
        LockPay ("we", "us") provides a peer accountability and conditional payment platform. This
        policy explains what information we collect, how we use it, and the choices you have.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>Account info: name, email, phone number, and authentication credentials.</li>
        <li>Payment info: card details handled by our PCI-certified payment processor (Stripe). LockPay never stores raw card numbers.</li>
        <li>Transaction info: amounts, recipients, release conditions, and statuses for agreements you create.</li>
        <li>Device info: device identifiers, push notification tokens, and basic technical logs.</li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>To operate conditional payments and release funds when conditions are met.</li>
        <li>To verify your identity and prevent fraud or unauthorized access.</li>
        <li>To send transactional notifications (SMS, email, push) about your agreements.</li>
        <li>To comply with legal and financial-services obligations.</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We share data only with the service providers required to operate LockPay (payment
        processing, SMS delivery, push notifications, hosting). We do not sell personal data.
      </p>

      <h2>Data retention &amp; deletion</h2>
      <p>
        You may request deletion of your account and personal data at any time from
        Profile → Delete Account. We process deletion requests within 7 days, subject to
        regulatory retention requirements for completed financial transactions.
      </p>

      <h2>Security</h2>
      <p>
        Transactions are encrypted in transit and at rest. Authentication uses industry-standard
        cryptographic primitives. Payment data is tokenized by Stripe.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
