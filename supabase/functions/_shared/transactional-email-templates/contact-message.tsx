import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Lock Pay'
const BLUE = '#2563eb'
const BG = '#ffffff'
const BORDER = '#e5e9f2'
const TEXT_DARK = '#0b1220'
const TEXT_MUTED = '#6b7280'
const TEXT_DIM = '#9ca3af'

interface ContactMessageProps {
  name?: string
  email?: string
  topic?: string
  subject?: string
  message?: string
}

const TOPIC_LABELS: Record<string, string> = {
  payments: 'Payments & transfers',
  onboarding: 'Account & onboarding',
  security: 'Security & fraud',
  billing: 'Billing & fees',
  technical: 'Technical issue',
  other: 'Something else',
}

const ContactMessageEmail = ({
  name = 'Anonymous',
  email = 'unknown',
  topic = 'other',
  subject = '(no subject)',
  message = '',
}: ContactMessageProps) => {
  const topicLabel = TOPIC_LABELS[topic] || topic
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`New contact form: ${subject}`}</Preview>
      <Body style={main}>
        <Container style={outer}>
          <Section style={{ padding: '0 0 16px' }}>
            <Text style={brandText}>
              Lock<span style={{ color: BLUE }}>Pay</span>
            </Text>
            <Hr style={{ borderColor: BORDER, margin: '12px 0 0' }} />
          </Section>

          <Heading style={h1}>New contact form submission</Heading>
          <Text style={subtle}>
            Submitted via the contact page on getlockpay.com.
          </Text>

          <Section style={panel}>
            <Row label="Name" value={name} />
            <Row label="Email" value={email} />
            <Row label="Topic" value={topicLabel} />
            <Row label="Subject" value={subject} />
          </Section>

          <Heading as="h2" style={h2}>Message</Heading>
          <Section style={messagePanel}>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Text style={footerText}>
            Reply directly to <a href={`mailto:${email}`} style={{ color: BLUE }}>{email}</a> to respond to this user.
          </Text>
          <Text style={signoff}>© {new Date().getFullYear()} {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
    <tr>
      <td style={detailLabelCell}>{label}</td>
      <td style={detailValueCell}>{value}</td>
    </tr>
  </table>
)

export const template = {
  component: ContactMessageEmail,
  to: 'support@getlockpayapp.com',
  subject: (d: Record<string, any>) =>
    `[Lock Pay Contact] ${(d.subject || '(no subject)').toString().slice(0, 120)}`,
  displayName: 'Contact form message',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    subject: 'Question about my transfer',
    message: 'Hi, I have a question about a recent payment...',
  },
} satisfies TemplateEntry

const main = { backgroundColor: BG, fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', margin: 0, padding: '32px 0', color: TEXT_DARK }
const outer = { padding: '0 24px', maxWidth: '560px', margin: '0 auto' }
const brandText = { color: TEXT_DARK, fontSize: '22px', fontWeight: 'bold' as const, margin: 0, lineHeight: '1', letterSpacing: '-0.5px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: TEXT_DARK, margin: '8px 0 6px', lineHeight: '1.25', letterSpacing: '-0.3px' }
const h2 = { fontSize: '14px', fontWeight: '600' as const, color: TEXT_MUTED, textTransform: 'uppercase' as const, letterSpacing: '0.6px', margin: '24px 0 8px' }
const subtle = { fontSize: '14px', color: TEXT_MUTED, margin: '0 0 20px' }
const panel = { border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '4px 16px', margin: 0 }
const messagePanel = { border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px 16px', margin: 0, backgroundColor: '#fafbfd' }
const messageText = { fontSize: '15px', color: TEXT_DARK, lineHeight: '1.55', margin: 0, whiteSpace: 'pre-wrap' as const }
const detailLabelCell = { color: TEXT_MUTED, fontSize: '13px', padding: '12px 16px 12px 0', verticalAlign: 'middle' as const, width: '90px', borderBottom: `1px solid ${BORDER}` }
const detailValueCell = { color: TEXT_DARK, fontSize: '14px', fontWeight: '600' as const, padding: '12px 0', verticalAlign: 'middle' as const, borderBottom: `1px solid ${BORDER}`, wordBreak: 'break-word' as const }
const footerText = { fontSize: '13px', color: TEXT_MUTED, margin: '28px 0 4px', lineHeight: '1.5' }
const signoff = { fontSize: '12px', color: TEXT_DIM, margin: '4px 0 0' }
