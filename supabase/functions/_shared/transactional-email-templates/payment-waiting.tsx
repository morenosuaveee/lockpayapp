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
const BG = '#ffffff'
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
      <Preview>{`${formatted} sent to you on ${SITE_NAME}`}</Preview>
      <Body style={main}>
        <Container style={outer}>
          {/* Header: logo lockup */}
          <Section style={header}>
            <table cellPadding={0} cellSpacing={0} role="presentation">
              <tr>
                <td style={{ paddingRight: '12px', verticalAlign: 'middle' }}>
                  <Img src={LOGO_URL} alt="" width="36" height="36" style={{ display: 'block' }} />
                </td>
                <td style={{ verticalAlign: 'middle' }}>
                  <Text style={brandText}>
                    Lock<span style={{ color: BLUE }}>Pay</span>
                  </Text>
                </td>
              </tr>
            </table>
            <div style={headerDivider} />
          </Section>

          {/* Main content */}
          <Section style={card}>
            <Heading style={h1}>
              {formatted} sent to you
            </Heading>

            <Text style={subtext}>
              {sender} locked in {formatted} for you on {SITE_NAME}.
            </Text>

            {/* Details */}
            <Section style={panel}>
              <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                <tr>
                  <td style={detailLabelCell}>Sender</td>
                  <td style={detailValueCell}>{sender}</td>
                </tr>
                <tr><td colSpan={2} style={rowDivider} /></tr>
                <tr>
                  <td style={detailLabelCell}>Amount</td>
                  <td style={detailValueCell}>{formatted}</td>
                </tr>
                <tr><td colSpan={2} style={rowDivider} /></tr>
                {note ? (
                  <>
                    <tr>
                      <td style={detailLabelCell}>Note</td>
                      <td style={detailValueCell}>{note}</td>
                    </tr>
                    <tr><td colSpan={2} style={rowDivider} /></tr>
                  </>
                ) : null}
                <tr>
                  <td style={detailLabelCell}>Status</td>
                  <td style={detailValueCell}>Locked in secure escrow</td>
                </tr>
              </table>
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: 'center', margin: '32px 0 14px' }}>
              <Button href={CLAIM_URL} style={button}>
                Claim your {formatted}
              </Button>
            </Section>

            <Text style={urgency}>
              Expires in 48 hours if not claimed.
            </Text>
          </Section>

          <Text style={footerText}>
            Funds are held in secure escrow and released only with your approval.
          </Text>
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
      ? `You received $${d.amount.toFixed(2)} on LockPay`
      : `You received a payment on LockPay`,
  displayName: 'Payment waiting',
  previewData: { amount: 5, note: 'tix', senderName: 'Keith Crosby', recipientName: 'Friend' },
} satisfies TemplateEntry

const main = { backgroundColor: BG, fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', margin: 0, padding: '32px 0', color: TEXT_DARK }
const outer = { padding: '0 24px', maxWidth: '560px', margin: '0 auto' }
const header = { padding: '0 0 20px' }
const headerDivider = { height: '1px', backgroundColor: BORDER, marginTop: '20px' }
const brandText = { color: TEXT_DARK, fontSize: '24px', fontWeight: 'bold' as const, margin: 0, lineHeight: '1', letterSpacing: '-0.5px' }
const card = { padding: '16px 0 8px' }
const h1 = { fontSize: '28px', fontWeight: 'bold' as const, color: TEXT_DARK, margin: '8px 0 12px', lineHeight: '1.2', letterSpacing: '-0.5px' }
const subtext = { fontSize: '15px', color: TEXT_MUTED, lineHeight: '1.55', margin: '0 0 28px' }
const panel = { border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '4px 20px', margin: 0 }
const detailLabelCell = { color: TEXT_MUTED, fontSize: '14px', padding: '14px 16px 14px 0', verticalAlign: 'middle' as const, width: '90px' }
const detailValueCell = { color: TEXT_DARK, fontSize: '15px', fontWeight: '600' as const, padding: '14px 0', verticalAlign: 'middle' as const }
const rowDivider = { borderTop: `1px solid ${BORDER}`, height: '1px', padding: 0 }
const button = { backgroundColor: BLUE, color: '#ffffff', padding: '14px 28px', borderRadius: '8px', textDecoration: 'none', fontSize: '15px', fontWeight: '600' as const, display: 'inline-block' }
const urgency = { fontSize: '13px', color: TEXT_MUTED, textAlign: 'center' as const, margin: '8px 0 0' }
const footerText = { fontSize: '13px', color: TEXT_MUTED, margin: '40px 0 8px', lineHeight: '1.5' }
const signoff = { fontSize: '12px', color: TEXT_DIM, margin: '4px 0 0' }
