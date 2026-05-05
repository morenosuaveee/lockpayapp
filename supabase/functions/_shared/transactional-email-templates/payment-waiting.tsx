import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'LockPay'
const APP_URL = 'https://code-lock-pay.lovable.app'
const LOGO_URL = `${APP_URL}/logo.png`
const CLAIM_URL = `${APP_URL}/transactions`
const ACCENT = '#ff5a1f' // red-orange

interface PaymentWaitingProps {
  amount?: number
  note?: string | null
  senderName?: string | null
  recipientName?: string | null
}

const PaymentWaitingEmail = ({ amount, note, senderName, recipientName }: PaymentWaitingProps) => {
  const formatted = typeof amount === 'number' ? `$${amount.toFixed(2)}` : 'A payment'
  const sender = senderName && senderName.trim() ? senderName : 'A contact'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`You've received ${formatted} on ${SITE_NAME} — secure it now`}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img src={LOGO_URL} alt={`${SITE_NAME}`} width="48" height="48" style={logo} />
            <Text style={brand}>{SITE_NAME}</Text>
          </Section>

          <Section style={card}>
            <Heading style={h1}>{formatted} Sent to You on {SITE_NAME}</Heading>
            <Text style={subtext}>
              {recipientName ? `${recipientName}, ` : ''}{sender.toLowerCase() === 'a contact' ? 'someone' : sender} just locked in {formatted} for you.
            </Text>

            {/* Details */}
            <Section style={details}>
              <Text style={detailRow}><span style={label}>Sender:</span> <span style={value}>{sender}</span></Text>
              {note ? (
                <Text style={detailRow}><span style={label}>Note:</span> <span style={value}>"{note}"</span></Text>
              ) : null}
              <Text style={detailRow}><span style={label}>Status:</span> <span style={value}>🔒 Locked (secure escrow)</span></Text>
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
              <Button href={CLAIM_URL} style={button}>Unlock Your {formatted}</Button>
            </Section>

            <Text style={urgency}>⏳ Expires in 48 hours if not claimed</Text>

            <Hr style={hr} />

            {/* Trust */}
            <Section>
              <Text style={trust}>🔐 Protected by secure escrow technology</Text>
              <Text style={trust}>💳 Funds released only with your approval</Text>
              <Text style={trust}>⚡ Instant transfer once unlocked</Text>
            </Section>
          </Section>

          <Text style={footer}>— The {SITE_NAME} Team</Text>
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
  previewData: { amount: 11, note: 'heehee', senderName: 'A contact', recipientName: 'Keith' },
} satisfies TemplateEntry

const main = { backgroundColor: '#0b1020', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: '24px 0' }
const container = { padding: '0 16px', maxWidth: '560px', margin: '0 auto' }
const header = { textAlign: 'center' as const, padding: '8px 0 20px' }
const logo = { display: 'inline-block', borderRadius: '12px' }
const brand = { color: '#ffffff', fontSize: '18px', fontWeight: 'bold' as const, margin: '8px 0 0', letterSpacing: '0.5px' }
const card = { backgroundColor: '#111733', borderRadius: '14px', padding: '28px 24px', border: `1px solid #1f2747` }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#ffffff', margin: '0 0 12px', textAlign: 'center' as const, lineHeight: '1.25' }
const subtext = { fontSize: '15px', color: '#cbd5e1', lineHeight: '1.55', margin: '0 0 20px', textAlign: 'center' as const }
const details = { backgroundColor: '#0b1020', border: '1px solid #1f2747', borderRadius: '10px', padding: '14px 16px', margin: '0 0 8px' }
const detailRow = { fontSize: '14px', color: '#e2e8f0', margin: '6px 0', lineHeight: '1.5' }
const label = { color: '#94a3b8' }
const value = { color: '#ffffff', fontWeight: 'bold' as const }
const button = { backgroundColor: ACCENT, color: '#ffffff', padding: '16px 28px', borderRadius: '10px', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold' as const, display: 'inline-block' }
const urgency = { fontSize: '13px', color: ACCENT, textAlign: 'center' as const, margin: '8px 0 4px', fontWeight: 'bold' as const }
const hr = { borderColor: '#1f2747', margin: '20px 0' }
const trust = { fontSize: '13px', color: '#cbd5e1', margin: '6px 0', textAlign: 'center' as const }
const footer = { fontSize: '12px', color: '#64748b', margin: '20px 0 0', textAlign: 'center' as const }
