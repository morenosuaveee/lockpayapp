import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'LockPay'
const APP_URL = 'https://code-lock-pay.lovable.app'
const LOGO_URL = `${APP_URL}/logo.png`
const CLAIM_URL = `${APP_URL}/transactions`
const ACCENT = '#ff7a1a' // orange
const GOLD = '#f5b544'
const BG = '#0a0a0a'
const CARD_BG = '#141414'
const PANEL_BG = '#1a1a1a'
const BORDER = '#262626'
const TEXT_MUTED = '#9ca3af'
const TEXT_DIM = '#6b7280'

interface PaymentWaitingProps {
  amount?: number
  note?: string | null
  senderName?: string | null
  recipientName?: string | null
}

const PaymentWaitingEmail = ({ amount, note, senderName, recipientName }: PaymentWaitingProps) => {
  const formatted = typeof amount === 'number' ? `$${amount.toFixed(2)}` : 'A payment'
  const sender = senderName && senderName.trim() ? senderName : 'Someone'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${formatted} sent to you on ${SITE_NAME} — secure it now`}</Preview>
      <Body style={main}>
        <Container style={outer}>
          {/* Top header bar */}
          <Section style={topBar}>
            <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ width: '100%' }}>
              <tr>
                <td style={{ verticalAlign: 'middle' }}>
                  <table cellPadding={0} cellSpacing={0} role="presentation">
                    <tr>
                      <td style={{ paddingRight: '10px', verticalAlign: 'middle' }}>
                        <Img src={LOGO_URL} alt="LockPay" width="36" height="36" style={{ display: 'block', borderRadius: '8px' }} />
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <Text style={brandText}>
                          Lock<span style={{ color: GOLD }}>Pay</span>
                        </Text>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
                  <Text style={tagline}>Secure. Private. Instant.</Text>
                  <Text style={taglineSub}>Your money, protected.</Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Main card */}
          <Section style={card}>
            {/* Lock icon circle */}
            <Section style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <Img src={LOGO_URL} alt="" width="64" height="64" style={{ display: 'inline-block', borderRadius: '50%', border: `2px solid ${ACCENT}` }} />
            </Section>

            <Heading style={h1}>
              {formatted} Sent to You<br />
              on <span style={{ color: GOLD }}>{SITE_NAME}</span>
            </Heading>

            <Text style={subtext}>
              {sender} just locked in <span style={{ color: GOLD, fontWeight: 'bold' }}>{formatted}</span> for you.
            </Text>

            {/* Details panel */}
            <Section style={panel}>
              <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                <tr>
                  <td style={detailLabelCell}>Sender:</td>
                  <td style={detailValueCell}>{sender}</td>
                </tr>
                {note ? (
                  <tr>
                    <td style={detailLabelCell}>Note:</td>
                    <td style={detailValueCell}>"{note}"</td>
                  </tr>
                ) : null}
                <tr>
                  <td style={detailLabelCell}>Status:</td>
                  <td style={detailValueCell}>
                    🔒 Locked (secure escrow)
                    <div style={statusSub}>Funds are safe and waiting for you.</div>
                  </td>
                </tr>
              </table>
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: 'center', margin: '28px 0 12px' }}>
              <Button href={CLAIM_URL} style={button}>
                🔓 Unlock Your {formatted} →
              </Button>
            </Section>

            <Text style={urgency}>
              ⏳ Expires in <span style={{ color: ACCENT, fontWeight: 'bold' }}>48 hours</span> if not claimed
            </Text>

            {/* Trust bullets */}
            <Section style={{ borderTop: `1px solid ${BORDER}`, marginTop: '24px', paddingTop: '20px' }}>
              <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                <tr>
                  <td style={trustCell}>
                    <Text style={trustTitle}>🔐 Secure Escrow</Text>
                    <Text style={trustBody}>Your funds are protected</Text>
                  </td>
                  <td style={trustCell}>
                    <Text style={trustTitle}>✅ You're in Control</Text>
                    <Text style={trustBody}>Release funds when ready</Text>
                  </td>
                  <td style={trustCell}>
                    <Text style={trustTitle}>⚡ Instant Transfer</Text>
                    <Text style={trustBody}>Send or spend instantly</Text>
                  </td>
                </tr>
              </table>
            </Section>
          </Section>

          {/* Footer trust bar */}
          <Section style={footerBar}>
            <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
              <tr>
                <td style={{ verticalAlign: 'middle' }}>
                  <Text style={footerTitle}>🛡 LockPay is built with bank-level security</Text>
                  <Text style={footerSub}>We never share your personal information.</Text>
                </td>
                <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
                  <Text style={helpTitle}>Need help?</Text>
                  <Text style={helpSub}>Visit our <span style={{ color: GOLD }}>Help Center</span></Text>
                </td>
              </tr>
            </table>
          </Section>

          <Text style={signoff}>— The {SITE_NAME} Team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PaymentWaitingEmail,
  subject: (d: Record<string, any>) =>
    typeof d.amount === 'number'
      ? `You've Received $${d.amount.toFixed(2)} — Secure It Now`
      : `You've Received a Payment — Secure It Now`,
  displayName: 'Payment waiting',
  previewData: { amount: 5, note: 'tix', senderName: 'Keith Crosby', recipientName: 'Friend' },
} satisfies TemplateEntry

const main = { backgroundColor: BG, fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: '20px 0', color: '#ffffff' }
const outer = { padding: '0 12px', maxWidth: '600px', margin: '0 auto' }
const topBar = { padding: '12px 4px 20px' }
const brandText = { color: '#ffffff', fontSize: '24px', fontWeight: 'bold' as const, margin: 0, lineHeight: '1' }
const tagline = { color: '#ffffff', fontSize: '13px', fontWeight: 'bold' as const, margin: 0, lineHeight: '1.3' }
const taglineSub = { color: TEXT_MUTED, fontSize: '12px', margin: '2px 0 0', lineHeight: '1.3' }
const card = { backgroundColor: CARD_BG, borderRadius: '16px', padding: '32px 28px', border: `1px solid ${BORDER}` }
const h1 = { fontSize: '32px', fontWeight: 'bold' as const, color: '#ffffff', margin: '4px 0 16px', textAlign: 'center' as const, lineHeight: '1.15' }
const subtext = { fontSize: '15px', color: '#e5e7eb', lineHeight: '1.55', margin: '0 0 24px', textAlign: 'center' as const }
const panel = { backgroundColor: PANEL_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '18px 20px', margin: '0 0 8px' }
const detailLabelCell = { color: TEXT_MUTED, fontSize: '14px', padding: '8px 16px 8px 0', verticalAlign: 'top' as const, width: '90px' }
const detailValueCell = { color: '#ffffff', fontSize: '14px', fontWeight: 'bold' as const, padding: '8px 0', verticalAlign: 'top' as const }
const statusSub = { color: TEXT_MUTED, fontSize: '12px', fontWeight: 'normal' as const, marginTop: '4px' }
const button = { backgroundColor: ACCENT, color: '#ffffff', padding: '18px 32px', borderRadius: '12px', textDecoration: 'none', fontSize: '17px', fontWeight: 'bold' as const, display: 'inline-block', boxShadow: `0 0 24px ${ACCENT}66` }
const urgency = { fontSize: '14px', color: '#e5e7eb', textAlign: 'center' as const, margin: '12px 0 4px' }
const trustCell = { textAlign: 'center' as const, padding: '0 8px', verticalAlign: 'top' as const, width: '33.33%' }
const trustTitle = { fontSize: '13px', color: GOLD, fontWeight: 'bold' as const, margin: '0 0 4px' }
const trustBody = { fontSize: '12px', color: TEXT_MUTED, margin: 0, lineHeight: '1.4' }
const footerBar = { backgroundColor: PANEL_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px 20px', margin: '20px 0 0' }
const footerTitle = { color: '#ffffff', fontSize: '13px', fontWeight: 'bold' as const, margin: 0 }
const footerSub = { color: TEXT_MUTED, fontSize: '12px', margin: '2px 0 0' }
const helpTitle = { color: GOLD, fontSize: '13px', fontWeight: 'bold' as const, margin: 0 }
const helpSub = { color: TEXT_MUTED, fontSize: '12px', margin: '2px 0 0' }
const signoff = { fontSize: '12px', color: TEXT_DIM, margin: '16px 0 0', textAlign: 'center' as const }
