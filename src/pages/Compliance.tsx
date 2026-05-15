import { LegalPage } from "@/components/layout/LegalPage";
import { SUPPORT_EMAIL } from "@/components/layout/LegalFooter";

export default function Compliance() {
  return (
    <LegalPage title="Compliance & Legal" updated="May 15, 2026">
      <h2>What Lock Pay is</h2>
      <p>
        Lock Pay is a technology platform for secure transfer coordination and recipient
        verification. Lock Pay helps users confirm a recipient's identity before initiating a
        peer-to-peer transfer through an independent third-party payment processor.
      </p>

      <h2>What Lock Pay is not</h2>
      <p>
        Lock Pay is <strong>not</strong> a bank, broker-dealer, money transmitter, escrow agent,
        custodian, or insured financial institution. Lock Pay does not hold customer funds, accept
        deposits, lend money, or provide banking, custody, or escrow services. Payment movement is
        performed exclusively by independent third-party payment processors.
      </p>

      <h2>Anti-fraud commitments</h2>
      <ul>
        <li>Every transfer is tied to a verified sender and recipient — no anonymous transfers.</li>
        <li>We monitor for fraud, account takeover, and abuse of the verification system.</li>
        <li>We may delay, decline, or cancel a transfer to protect users or comply with law.</li>
        <li>We cooperate with lawful requests from regulators and law enforcement.</li>
      </ul>

      <h2>Identity verification standards</h2>
      <p>
        Accounts must be opened by a real person, age 18 or older, with a verified phone number and
        accurate identifying information. We may require additional verification at our discretion
        before a transfer can be initiated, especially for higher-value or higher-risk activity.
      </p>

      <h2>Transfer workflow</h2>
      <p>
        When a transfer is initiated, Lock Pay first verifies the recipient's identity and asks
        them to confirm in-app. Payment movement itself is performed by an independent third-party
        payment processor under that processor's terms. If the recipient is not verified or does
        not confirm within the configured window, the transfer request is cancelled and any
        pending charge is reversed by the processor according to its standard timelines.
      </p>

      <h2>Restricted activities</h2>
      <p>Lock Pay may not be used for:</p>
      <ul>
        <li>Gambling, wagering, sports betting, fantasy sports, or games of chance.</li>
        <li>Cryptocurrency exchange or trading.</li>
        <li>Illegal goods or services, money laundering, or sanctions evasion.</li>
        <li>Adult content, weapons, or any activity prohibited by our payment processor.</li>
        <li>Coercive, deceptive, or non-consensual transfer requests.</li>
      </ul>

      <h2>Sanctions and geographic availability</h2>
      <p>
        Lock Pay screens accounts and activity against sanctions and watchlists maintained by
        authorities including OFAC. Availability of features may vary by region and account status.
      </p>

      <h2>Data and record retention</h2>
      <p>
        We retain account and transfer records for as long as required to meet applicable legal,
        tax, and anti-money-laundering obligations. See our <a href="/privacy">Privacy Policy</a>{" "}
        for full details.
      </p>

      <h2>Consumer dispute support</h2>
      <p>
        Lock Pay supports the dispute and chargeback rights provided by your payment method. If
        you believe a transfer was unauthorized, contact us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and notify your card issuer or bank.
      </p>

      <h2>Regulatory contact</h2>
      <p>
        Regulators, payment partners, and law-enforcement personnel can reach our compliance team
        at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Please include your jurisdiction
        and the nature of the request.
      </p>
    </LegalPage>
  );
}
