import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'
import { sendAndLog } from '../_shared/transactional-email-templates/log-send.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const TOPICS = ['account', 'payment', 'security', 'other']

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Simple in-memory rate limit: max 3 submissions per IP per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 3
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  return false
}

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (rateLimited(ip)) {
    return json({ error: 'Too many messages. Please try again later.' }, 429)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON in request body' }, 400)
  }

  const name = clean(body.name, 100)
  const email = clean(body.email, 255).toLowerCase()
  const topic = clean(body.topic, 40)
  const subject = clean(body.subject, 150)
  const message = clean(body.message, 2000)

  if (!name || !email || !subject || !message) {
    return json({ error: 'Please complete every field.' }, 400)
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Please enter a valid email address.' }, 400)
  }
  if (!TOPICS.includes(topic)) {
    return json({ error: 'Please choose a valid topic.' }, 400)
  }

  // The contact template defines a fixed recipient (the support inbox), so the
  // browser can never choose who this goes to.
  const supportInbox = 'support@getlockpay.com'

  try {
    const result = await sendAndLog(
      () =>
        sendTemplateEmail('contact-message', supportInbox, {
          templateData: { name, email, topic, subject, message },
          replyTo: email,
        }),
      { templateName: 'contact-message', recipientEmail: supportInbox }
    )
    if (!result.sent) {
      console.log('Contact message not delivered', { reason: result.reason })
    }
    return json({ success: true })
  } catch (error) {
    console.error('Contact message send failed', error)
    return json({ error: 'Failed to send message' }, 500)
  }
})
