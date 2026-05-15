import { LegalPage } from "@/components/layout/LegalPage";
import { SUPPORT_EMAIL } from "@/components/layout/LegalFooter";

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="May 14, 2026">
      <p>
        Welcome to Lock Pay. These Terms of Service ("Terms") govern your access to and use of the
        Lock Pay platform — a technology service for secure transfer coordination and recipient
        verification. By creating an account or using Lock Pay you agree to these Terms.
      </p>

      <h2>User eligibility</h2>
      <p>
        You must be at least 18 years old, legally able to enter binding agreements, and located in
        a jurisdiction where Lock Pay is available. You agree to provide accurate information and
        keep your account credentials secure.
      </p>

      <h2>Acceptable use policy</h2>
      <ul>
        <li>Use Lock Pay only for lawful, good-faith payment coordination between consenting parties.</li>
        <li>Do not impersonate others, abuse the dual-confirmation flow, or coerce confirmations.</li>
        <li>Do not attempt to disrupt, reverse-engineer, or probe the platform's security.</li>
      </ul>

      <h2>Transfer coordination disclaimers</h2>
      <p>
        Lock Pay is a technology platform that helps two parties coordinate a peer-to-peer
        transfer with recipient identity confirmation. Lock Pay is <strong>not</strong> a bank,
        broker-dealer, money transmitter, escrow agent, custodian, or insured financial
        institution, and does not hold customer funds, accept deposits, or guarantee any transfer.
        Payment movement is performed by independent third-party payment processors under their
        own terms.
      </p>

      <h2>Fraud and abuse prevention</h2>
      <p>
        We monitor accounts and activity for fraud, chargebacks, identity misuse, and abuse of the
        verification system. We may delay, decline, cancel, or reverse a transfer request, and may
        require additional verification at our discretion to protect users.
      </p>

      <h2>Restricted activities</h2>
      <p>Lock Pay may not be used for, and we do not facilitate:</p>
      <ul>
        <li>Gambling, wagering, sports betting, fantasy sports, prize pools, or games of chance.</li>
        <li>Illegal goods or services, money laundering, or sanctions-evasion.</li>
        <li>Adult content, weapons, or any activity prohibited by our payment processor.</li>
        <li>Coercive, deceptive, or non-consensual payment requests.</li>
      </ul>

      <h2>Account termination rights</h2>
      <p>
        You may close your account at any time. We may suspend or terminate accounts that violate
        these Terms, applicable law, or our processor's policies, with or without notice where
        necessary to protect users.
      </p>

      <h2>Intellectual property protections</h2>
      <p>
        Lock Pay, the Lock Pay name, logos, software, and all related materials are owned by
        Lock Pay and protected by intellectual property laws. You receive a limited, revocable,
        non-exclusive license to use the platform for its intended purpose.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Lock Pay and its affiliates are not liable for
        indirect, incidental, special, consequential, or punitive damages, or for lost profits,
        revenues, data, or goodwill. Our aggregate liability is limited to the fees you paid to
        Lock Pay in the twelve months preceding the claim.
      </p>

      <h2>Service availability disclaimer</h2>
      <p>
        Lock Pay is provided on an "as is" and "as available" basis. We do not guarantee
        uninterrupted operation, error-free service, or specific transaction completion times.
        Availability and features may vary by region.
      </p>

      <h2>Arbitration and governing law</h2>
      <p>
        These Terms are governed by the laws of the State of Delaware, without regard to conflict
        of law principles. Any dispute arising out of or relating to Lock Pay shall be resolved by
        binding individual arbitration, except where prohibited by law. You and Lock Pay waive the
        right to participate in a class action.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
