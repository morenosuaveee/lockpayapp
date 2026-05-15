import { LegalPage } from "@/components/layout/LegalPage";
import { SUPPORT_EMAIL } from "@/components/layout/LegalFooter";

export default function Compliance() {
  return (
    <LegalPage title="Compliance & Legal" updated="May 15, 2026">
      <p>
        Lock Pay is a technology platform that coordinates peer-to-peer payments with a
        confirmation-based protection layer. Lock Pay is not a bank, broker-dealer, money
        transmitter, or escrow agent in any jurisdiction where licensure would be required for such
        activity. Payment movement is performed by our regulated payment partners.
      </p>

      <h2>Anti-fraud commitments</h2>
      <ul>
        <li>Every transfer is tied to a verified sender and recipient — no anonymous payouts.</li>
        <li>We monitor for fraud, account takeover, chargeback abuse, and coercive confirmations.</li>
        <li>We may delay, hold, reverse, or refund a transaction to protect users or comply with law.</li>
        <li>We cooperate with lawful requests from regulators and law enforcement.</li>
      </ul>

      <h2>Identity verification standards</h2>
      <p>
        Accounts must be opened by a real person, age 18 or older, with a verified phone number and
        accurate identifying information. We may require additional verification at our discretion
        before releasing funds, especially for higher-value or higher-risk transfers.
      </p>

      <h2>Transaction protection</h2>
      <p>
        Funds are captured by our payment processor and held in a confirmation state until the
        recipient is verified and accepts the transfer. If verification or acceptance does not occur
        within the protection window, the transfer is automatically reversed to the sender's
        original payment method.
      </p>

      <h2>Restricted activities</h2>
      <p>Lock Pay may not be used for:</p>
      <ul>
        <li>Gambling, wagering, sports betting, fantasy sports, or games of chance.</li>
        <li>Cryptocurrency exchange or trading.</li>
        <li>Illegal goods or services, money laundering, or sanctions evasion.</li>
        <li>Adult content, weapons, or any activity prohibited by our payment processor.</li>
        <li>Coercive, deceptive, or non-consensual payment requests.</li>
      </ul>

      <h2>Sanctions and geographic availability</h2>
      <p>
        Lock Pay screens accounts and transactions against sanctions and watchlists maintained by
        authorities including OFAC. Availability of features may vary by region and account status.
      </p>

      <h2>Data and record retention</h2>
      <p>
        We retain account and transaction records for as long as required to meet financial-services,
        tax, and anti-money-laundering obligations. See our <a href="/privacy">Privacy Policy</a> for
        full details.
      </p>

      <h2>Consumer protection</h2>
      <p>
        Lock Pay supports the dispute and chargeback rights provided by your payment method. If you
        believe a transaction was unauthorized, contact us immediately at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and notify your card issuer or bank.
      </p>

      <h2>Regulatory contact</h2>
      <p>
        Regulators, payment partners, and law-enforcement personnel can reach our compliance team at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Please include your jurisdiction and
        the nature of the request.
      </p>
    </LegalPage>
  );
}
