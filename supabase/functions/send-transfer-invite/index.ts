// Auth-gated invite dispatcher: lookup recipient → if not a LockPay user,
// generate a claim token, save invite metadata, and send SMS or email.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const BodySchema = z.object({
  transactionId: z.string().uuid(),
  resend: z.boolean().optional(),
})

function detectChannel(identifier: string): 'email' | 'phone' | null {
  const v = identifier.trim()
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'email'
  if (/^\+[1-9]\d{6,14}$/.test(v)) return 'phone'
  return null
}

function genToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function formatAmount(n: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
  } catch {
    return `$${n.toFixed(2)}`
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const token = authHeader.replace('Bearer ', '')
  const { data: claims, error: authErr } = await userClient.auth.getClaims(token)
  if (authErr || !claims?.claims) return json({ error: 'Unauthorized' }, 401)
  const senderId = claims.claims.sub as string

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)

  const admin = createClient(supabaseUrl, serviceKey)

  // Load txn (admin client; we re-validate sender)
  const { data: txn, error: txErr } = await admin
    .from('transactions')
    .select('*')
    .eq('id', parsed.data.transactionId)
    .maybeSingle()
  if (txErr || !txn) return json({ error: 'Transaction not found' }, 404)
  if (txn.sender_id !== senderId) return json({ error: 'Not authorized' }, 403)

  const channel = detectChannel(txn.recipient_identifier)
  if (!channel) return json({ error: 'Recipient must be an email or phone in international format' }, 400)

  // If recipient already exists, return existing
  const norm = channel === 'email' ? txn.recipient_identifier.trim().toLowerCase() : txn.recipient_identifier.trim()
  const lookupColumn = channel === 'email' ? 'paypal_email' : 'phone'
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq(lookupColumn, norm)
    .maybeSingle()

  if (existingProfile?.id) {
    return json({ existing: true, recipientId: existingProfile.id })
  }

  // Generate or reuse claim token
  const claimToken = txn.claim_token ?? genToken()

  if (!txn.claim_token || parsed.data.resend) {
    const { error: updErr } = await admin
      .from('transactions')
      .update({
        claim_token: claimToken,
        recipient_channel: channel,
        recipient_identifier: norm,
        invite_sent_at: new Date().toISOString(),
        status: 'pending_invite',
      })
      .eq('id', txn.id)
    if (updErr) return json({ error: updErr.message }, 500)
  }

  // Sender display name for the message
  const { data: senderProfile } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', senderId)
    .maybeSingle()
  const senderName = senderProfile?.display_name || 'A LockPay user'

  const origin = req.headers.get('origin') || 'https://getlockpay.com'
  const claimUrl = `${origin}/claim/${claimToken}`
  const amount = formatAmount(Number(txn.amount), txn.currency || 'USD')

  // Dispatch
  if (channel === 'email') {
    const { error: emailErr } = await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'transfer-invite',
        recipientEmail: norm,
        idempotencyKey: `invite-${claimToken}`,
        templateData: { senderName, amount, claimUrl },
      },
    })
    if (emailErr) {
      console.error('Email send failed', emailErr)
      return json({ error: 'Failed to send invite email' }, 500)
    }
  } else {
    const text = `${senderName} sent you ${amount} via LockPay. Verify your identity and confirm with the secure 4-digit code: ${claimUrl}`
    const { error: smsErr } = await admin.functions.invoke('send-telnyx-sms', {
      body: { to: norm, text },
    })
    if (smsErr) {
      console.error('SMS send failed', smsErr)
      return json({ error: 'Failed to send invite SMS' }, 500)
    }
  }

  return json({ success: true, channel, claimToken, claimUrl })
})
