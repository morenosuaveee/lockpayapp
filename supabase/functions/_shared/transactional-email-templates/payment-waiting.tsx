import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'LockPay'
const APP_URL = 'https://code-lock-pay.lovable.app'

interface PaymentWaitingProps {
  amount?: number
  note?: string | null
}

const PaymentWaitingEmail = ({ amount, note }: PaymentWaitingProps) => {
  const formatted = typeof amount === 'number' ? `$${amount.toFixed(2)}` : 'A payment'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${formatted} is waiting for you on ${SITE_NAME}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You have {formatted} waiting</Heading>
          <Text style={text}>
            Someone sent you {formatted} on {SITE_NAME}.
            {note ? ` Note: "${note}".` : ''}
          </Text>
          <Text style={text}>
            To claim it, sign in and enter the unlock code the sender shared with you.
          </Text>
          <Section style={{ textAlign: 'center', margin: '30px 0' }}>
            <Button href={APP_URL} style={button}>Claim your payment</Button>
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
      ? `You have $${d.amount.toFixed(2)} waiting on ${SITE_NAME}`
      : `You have a payment waiting on ${SITE_NAME}`,
  displayName: 'Payment waiting',
  previewData: { amount: 25, note: 'Lunch' },
} satisfies TemplateEntry
