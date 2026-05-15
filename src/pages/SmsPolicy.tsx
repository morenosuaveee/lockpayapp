import { LegalPage } from "@/components/layout/LegalPage";
import { SUPPORT_EMAIL } from "@/components/layout/LegalFooter";

export default function SmsPolicy() {
  return (
    <LegalPage title="SMS Communication Policy" updated="May 14, 2026">
      <p>
        Lock Pay uses SMS to keep your account secure and to keep both parties informed during a
        dual-confirmation payment. This policy explains how SMS works on Lock Pay.
      </p>

      <h2>Opt-in</h2>
      <p>
        Users must opt in before receiving SMS communications from Lock Pay. You opt in by
        entering and verifying your phone number during signup or in your profile settings.
      </p>

      <h2>Message frequency</h2>
      <p>
        Message frequency varies based on account activity and transfers — verifications, payment
        events, and security alerts. <strong>Consent is not a condition of purchase.</strong>
      </p>

      <h2>Carrier rates</h2>
      <p>Standard carrier messaging and data rates may apply.</p>

      <h2>Opt-out and help</h2>
      <ul>
        <li>Reply <strong>STOP</strong> to any message to unsubscribe.</li>
        <li>Reply <strong>HELP</strong> for assistance.</li>
        <li>You may also disable SMS from your profile settings at any time.</li>
      </ul>

      <h2>What we use SMS for</h2>
      <ul>
        <li>Account verification</li>
        <li>Login authentication</li>
        <li>Payment notifications</li>
        <li>Transaction confirmations</li>
        <li>Security alerts</li>
      </ul>

      <h2>Privacy</h2>
      <p>
        Lock Pay does not sell or share SMS consent data for marketing purposes. SMS data is used
        only to deliver the messages above and to keep your account secure. See our{" "}
        <a href="/privacy">Privacy Policy</a> for details.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about SMS on Lock Pay? Email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
