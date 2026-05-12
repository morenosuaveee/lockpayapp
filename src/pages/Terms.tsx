import { LegalPage } from "@/components/layout/LegalPage";
import { SUPPORT_EMAIL } from "@/components/layout/LegalFooter";

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="May 12, 2026">
      <p>
        By using LockPay you agree to these terms. LockPay is a peer accountability and conditional
        payment platform that lets two parties voluntarily lock funds and release them when their
        agreed conditions are met.
      </p>

      <h2>Eligibility</h2>
      <p>You must be at least 18 years old and legally able to enter binding agreements.</p>

      <h2>What LockPay is — and isn't</h2>
      <ul>
        <li>LockPay facilitates conditional transfers between two consenting parties.</li>
        <li>LockPay is not a bank, broker, or money transmitter.</li>
        <li>LockPay does not facilitate gambling, wagering, sports betting, or games of chance.</li>
        <li>Use of LockPay for any prohibited purpose may result in account termination and reversal of funds.</li>
      </ul>

      <h2>Locked funds &amp; release conditions</h2>
      <p>
        When a sender creates a conditional transfer, the funds are charged to their payment method
        and held against the agreement. Funds are released to the recipient when both parties confirm
        the agreed unlock condition. If the agreement expires without release, funds are returned to
        the sender, less applicable processing fees.
      </p>

      <h2>Fees</h2>
      <p>
        LockPay charges a transparent platform fee disclosed at checkout. Payment-processor fees may
        also apply and are non-refundable on completed transfers.
      </p>

      <h2>Disputes</h2>
      <p>
        If parties disagree on whether a release condition was met, contact{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. LockPay may freeze a transaction
        pending review.
      </p>

      <h2>Termination</h2>
      <p>
        You may close your account at any time. We may suspend accounts that violate these terms or
        applicable law.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
