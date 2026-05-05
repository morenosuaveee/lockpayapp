import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'LockPay'
const APP_URL = 'https://code-lock-pay.lovable.app'
const LOGO_URL = `${APP_URL}/logo.png`
const CLAIM_URL = `${APP_URL}/transactions`

const BLUE = '#2563eb'
const BLUE_DARK = '#1d4ed8'
const BLUE_LIGHT = '#dbeafe'
const BG = '#f5f7fb'
const CARD_BG = '#ffffff'
const PANEL_BG = '#ffffff'
const BORDER = '#e5e9f2'
const TEXT_DARK = '#0b1220'
const TEXT_MUTED = '#6b7280'
const TEXT_DIM = '#9ca3af'

interface PaymentWaitingProps {
  amount?: number
  note?: string | null
  senderName?: string | null
  recipientName?: string | null
}

const PaymentWaitingEmail = ({ amount, note, senderName }: PaymentWaitingProps) => {
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
                      <td style={{ paddingRight: '12px', verticalAlign: 'middle' }}>
                        <Img src={LOGO_URL} alt="LockPay" width="40" height="40" style={{ display: 'block' }} />
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <Text style={brandText}>
                          Lock<span style={{ color: BLUE }}>Pay</span>
                        </Text>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
                  <Text style={tagline}>🛡 Secure. Private. Instant.</Text>
                  <Text style={taglineSub}>Your money, protected.</Text>
                </td>
              </tr>
            </table>
            <div style={headerDivider} />
          </Section>

          {/* Main content */}
          <Section style={card}>
            {/* Lock icon medallion */}
            <Section style={{ textAlign: 'center', padding: '8px 0 12px' }}>
              <div style={medallion}>
                <Img src={LOGO_URL} alt="" width="56" height="56" style={{ display: 'inline-block' }} />
              </div>
            </Section>

            <Heading style={h1}>
              {formatted} Sent to You<br />
              on <span style={{ color: BLUE }}>{SITE_NAME}</span>
            </Heading>

            <Text style={subtext}>
              {sender} just locked in <span style={{ color: BLUE, fontWeight: 'bold' }}>{formatted}</span> for you.
            </Text>

            {/* Details panel */}
            <Section style={panel}>
              <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                <tr>
                  <td style={detailLabelCell}>Sender:</td>
                  <td style={detailValueCell}>{sender}</td>
                </tr>
                <tr><td colSpan={2} style={rowDivider} /></tr>
                {note ? (
                  <>
                    <tr>
                      <td style={detailLabelCell}>Note:</td>
                      <td style={detailValueCell}>"{note}"</td>
                    </tr>
                    <tr><td colSpan={2} style={rowDivider} /></tr>
                  </>
                ) : null}
                <tr>
                  <td style={detailLabelCell}>Status:</td>
                  <td style={detailValueCell}>
                    🔒 <span style={{ color: TEXT_DARK }}>Locked (secure escrow)</span>
                    <div style={statusSub}>Funds are safe and waiting for you.</div>
                  </td>
                </tr>
              </table>
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: 'center', margin: '32px 0 14px' }}>
              <Button href={CLAIM_URL} style={button}>
                🔓  Unlock Your {formatted}  →
              </Button>
            </Section>

            <Text style={urgency}>
              ⏱ Expires in <span style={{ color: BLUE, fontWeight: 'bold' }}>48 hours</span> if not claimed
            </Text>

            {/* Trust bullets */}
            <Section style={trustWrap}>
              <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                <tr>
                  <td style={trustCell}>
                    <Text style={trustTitle}>🔐 Secure Escrow</Text>
                    <Text style={trustBody}>Your funds are protected</Text>
                  </td>
                  <td style={trustCell}>
                    <Text style={trustTitle}>👤 You're in Control</Text>
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
                  <Text style={footerTitle}>🔒 LockPay is built with bank-level security</Text>
                  <Text style={footerSub}>We never share your personal information.</Text>
                </td>
                <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
                  <Text style={helpTitle}>❓ Need help?</Text>
                  <Text style={helpSub}>Visit our <span style={{ color: BLUE }}>Help Center</span></Text>
                </td>
              </tr>
            </table>
          </Section>

          <Text style={signoff}>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</Text>
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

const main = { backgroundColor: BG, fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: '24px 0', color: TEXT_DARK }
const outer = { padding: '0 16px', maxWidth: '620px', margin: '0 auto' }
const topBar = { padding: '4px 4px 16px' }
const headerDivider = { height: '2px', background: `linear-gradient(90deg, ${BLUE}, ${BLUE_LIGHT})`, marginTop: '14px', borderRadius: '2px' }
const brandText = { color: TEXT_DARK, fontSize: '28px', fontWeight: 'bold' as const, margin: 0, lineHeight: '1' }
const tagline = { color: TEXT_DARK, fontSize: '14px', fontWeight: 'bold' as const, margin: 0, lineHeight: '1.3' }
const taglineSub = { color: TEXT_MUTED, fontSize: '12px', margin: '2px 0 0', lineHeight: '1.3' }
const card = { backgroundColor: 'transparent', padding: '24px 8px 8px' }
const medallion = { display: 'inline-block', padding: '14px', borderRadius: '50%', backgroundColor: '#ffffff', boxShadow: `0 0 40px ${BLUE}55, 0 8px 24px ${BLUE}22`, border: `1px solid ${BLUE_LIGHT}` }
const h1 = { fontSize: '38px', fontWeight: 'bold' as const, color: TEXT_DARK, margin: '12px 0 16px', textAlign: 'center' as const, lineHeight: '1.1', letterSpacing: '-0.5px' }
const subtext = { fontSize: '16px', color: TEXT_MUTED, lineHeight: '1.55', margin: '0 0 24px', textAlign: 'center' as const }
const panel = { backgroundColor: PANEL_BG, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '8px 22px', margin: '0', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }
const detailLabelCell = { color: TEXT_MUTED, fontSize: '15px', padding: '18px 16px 18px 0', verticalAlign: 'middle' as const, width: '110px' }
const detailValueCell = { color: TEXT_DARK, fontSize: '16px', fontWeight: 'bold' as const, padding: '18px 0', verticalAlign: 'middle' as const }
const rowDivider = { borderTop: `1px solid ${BORDER}`, height: '1px', padding: 0 }
const statusSub = { color: TEXT_MUTED, fontSize: '13px', fontWeight: 'normal' as const, marginTop: '4px' }
const button = { background: `linear-gradient(180deg, ${BLUE}, ${BLUE_DARK})`, backgroundColor: BLUE, color: '#ffffff', padding: '20px 44px', borderRadius: '14px', textDecoration: 'none', fontSize: '20px', fontWeight: 'bold' as const, display: 'inline-block', boxShadow: `0 0 36px ${BLUE}80, 0 0 12px ${BLUE}66, 0 8px 20px ${BLUE}40` }
const urgency = { fontSize: '15px', color: TEXT_MUTED, textAlign: 'center' as const, margin: '14px 0 4px' }
const trustWrap = { backgroundColor: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px 12px', marginTop: '24px' }
const trustCell = { textAlign: 'center' as const, padding: '0 8px', verticalAlign: 'top' as const, width: '33.33%' }
const trustTitle = { fontSize: '14px', color: TEXT_DARK, fontWeight: 'bold' as const, margin: '0 0 6px' }
const trustBody = { fontSize: '13px', color: TEXT_MUTED, margin: 0, lineHeight: '1.4' }
const footerBar = { backgroundColor: '#ffffff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px 22px', margin: '20px 0 0' }
const footerTitle = { color: TEXT_DARK, fontSize: '14px', fontWeight: 'bold' as const, margin: 0 }
const footerSub = { color: TEXT_MUTED, fontSize: '12px', margin: '2px 0 0' }
const helpTitle = { color: BLUE, fontSize: '14px', fontWeight: 'bold' as const, margin: 0 }
const helpSub = { color: TEXT_MUTED, fontSize: '12px', margin: '2px 0 0' }
const signoff = { fontSize: '12px', color: TEXT_DIM, margin: '18px 0 0', textAlign: 'center' as const }
