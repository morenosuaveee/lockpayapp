import { ShieldCheck, Lock, Fingerprint, EyeOff, BadgeCheck, Activity, KeyRound, ServerCog } from "lucide-react";
import { LegalPage } from "@/components/layout/LegalPage";
import { SUPPORT_EMAIL } from "@/components/layout/LegalFooter";

const PILLARS = [
  { icon: BadgeCheck, title: "Recipient verification", desc: "Every payee must be matched to a verified Lock Pay account before a transfer is initiated. Unverified destinations cannot receive a Lock Pay transfer." },
  { icon: Lock, title: "Encryption everywhere", desc: "Traffic is encrypted in transit with TLS 1.2+ and sensitive data is encrypted at rest. Card details are tokenized by our PCI-compliant payment processor — Lock Pay never stores raw card numbers." },
  { icon: EyeOff, title: "Mistake prevention", desc: "Identity confirmation is required before a transfer is initiated, designed to help reduce mistaken transfers and impersonation attempts." },
  { icon: Fingerprint, title: "Account protection", desc: "Phone-verified accounts, device-bound sessions, and biometric unlock options keep account access tightly scoped to you." },
  { icon: KeyRound, title: "Secure authentication", desc: "Authentication runs on industry-standard providers with one-time codes and session rotation, with optional Apple and Google sign-in." },
  { icon: Activity, title: "Activity monitoring", desc: "Account and transfer activity is monitored for anomalous patterns and may require additional verification." },
];

export default function Security() {
  return (
    <LegalPage
      title="Security"
      subtitle="Verification and encryption are built into every transfer."
      updated="May 15, 2026"
    >
      <p>
        Lock Pay is a secure transfer coordination platform. Recipient identity is confirmed
        before a transfer is initiated, and every transfer is logged with a clear audit trail —
        designed to help reduce mistaken transfers.
      </p>

      <div className="not-prose mt-6 grid gap-3 sm:grid-cols-2">
        {PILLARS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-border/70 bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      <h2>Infrastructure</h2>
      <p>
        Payment movement is performed by Stripe, an independent PCI-DSS Level 1 certified payment
        processor. Identity, SMS verification, and notifications are delivered through
        industry-standard providers under contract to protect your data. Lock Pay does not hold
        customer funds.
      </p>

      <div className="not-prose mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1"><ShieldCheck className="h-3.5 w-3.5" /> TLS 1.2+</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1"><Lock className="h-3.5 w-3.5" /> AES-256 at rest</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1"><ServerCog className="h-3.5 w-3.5" /> PCI-DSS processor</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1"><BadgeCheck className="h-3.5 w-3.5" /> Verified recipients</span>
      </div>

      <h2>Reporting suspicious activity or vulnerabilities</h2>
      <p>
        If you notice suspicious activity on your account or believe you've found a vulnerability,
        please email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with details. We
        respond to legitimate reports within one business day.
      </p>

      <h2>What we will never do</h2>
      <ul>
        <li>Ask for your password, full card number, or one-time code over SMS, email, or phone.</li>
        <li>Ask you to move money to a different account "for safekeeping."</li>
        <li>Request remote access to your device.</li>
        <li>Promise insurance, guarantees, or any custodial holding of your funds — Lock Pay does not offer these.</li>
      </ul>
      <p>
        If anyone contacts you claiming to be Lock Pay and asks for these things, do not respond —
        report it to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
