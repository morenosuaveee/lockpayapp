import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Lock Pay'
const BLUE = '#2563eb'
const BG = '#ffffff'
const BORDER = '#e5e9f2'
const TEXT_DARK = '#0b1220'
const TEXT_MUTED = '#6b7280'

interface TransferInviteProps {
  senderName?: string
  amount?: string        // formatted "$12.50"
  claimUrl?: string
}

const TransferInviteEmail = ({ senderName, amount, claimUrl }: TransferInviteProps) => {
  const sender = senderName || 'A LockPay user'
  const amt = amount || 'a transfer'
  const url = claimUrl || 'https://getlockpay.com'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{sender} sent you {amt} via LockPay — verify to claim</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brand}>
            <Heading as="h2" style={brandText}>LockPay</Heading>
          </Section>

          <Heading style={h1}>You've received a secure transfer</Heading>
          <Text style={lead}>
            <strong style={{ color: TEXT_DARK }}>{sender}</strong> sent you{' '}
            <strong style={{ color: TEXT_DARK }}>{amt}</strong> via LockPay.
          </Text>

          <Section style={amountCard}>
            <Text style={amountLabel}>Amount</Text>
            <Text style={amountValue}>{amt}</Text>
          </Section>

          <Text style={text}>
            Verify your identity and confirm the transfer using the secure 4-digit code shared with you by the sender.
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
            <Button href={url} style={primaryBtn}>Claim transfer</Button>
          </Section>

          <Text style={smallMuted}>
            Or open this link: <br />
            <span style={{ color: BLUE, wordBreak: 'break-all' }}>{url}</span>
          </Text>

          <Hr style={hr} />

          <Text style={small}>
            <strong>How LockPay works:</strong> Both sender and recipient confirm the same 4-digit code before any payment is made. Lock Pay is not a bank or money transmitter — we coordinate verification only.
          </Text>
          <Text style={small}>
            If you weren't expecting this transfer, you can safely ignore this email. The request will auto-cancel if not confirmed within 48 hours.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TransferInviteEmail,
  subject: (data: Record<string, any>) =>
    `${data?.senderName || 'Someone'} sent you ${data?.amount || 'a transfer'} via LockPay`,
  displayName: 'Transfer invite',
  previewData: {
    senderName: 'Alex Carter',
    amount: '$12.50',
    claimUrl: 'https://getlockpay.com/claim/preview-token',
  },
} satisfies TemplateEntry

const main: React.CSSProperties = { backgroundColor: BG, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container: React.CSSProperties = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const brand: React.CSSProperties = { marginBottom: '24px' }
const brandText: React.CSSProperties = { fontSize: '18px', fontWeight: 700, color: BLUE, margin: 0, letterSpacing: '-0.01em' }
const h1: React.CSSProperties = { fontSize: '24px', fontWeight: 700, color: TEXT_DARK, margin: '0 0 12px', lineHeight: 1.2 }
const lead: React.CSSProperties = { fontSize: '15px', color: TEXT_MUTED, lineHeight: 1.55, margin: '0 0 24px' }
const text: React.CSSProperties = { fontSize: '14px', color: TEXT_MUTED, lineHeight: 1.6, margin: '0 0 16px' }
const small: React.CSSProperties = { fontSize: '12px', color: TEXT_MUTED, lineHeight: 1.55, margin: '0 0 12px' }
const smallMuted: React.CSSProperties = { fontSize: '12px', color: TEXT_MUTED, textAlign: 'center', margin: '12px 0 0' }
const amountCard: React.CSSProperties = { background: '#f6f8fc', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px', textAlign: 'center', margin: '8px 0 24px' }
const amountLabel: React.CSSProperties = { fontSize: '11px', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }
const amountValue: React.CSSProperties = { fontSize: '34px', fontWeight: 700, color: TEXT_DARK, margin: '6px 0 0' }
const primaryBtn: React.CSSProperties = { background: BLUE, color: '#fff', padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }
const hr: React.CSSProperties = { border: 'none', borderTop: `1px solid ${BORDER}`, margin: '28px 0 16px' }
