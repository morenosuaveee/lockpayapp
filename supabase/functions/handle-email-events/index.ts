import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Notification-only bookkeeping: Lovable enforces suppression at send time.
// These rows keep the app's existing email history and suppression views intact.

function getSupabase() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase environment configuration')
  }
  return createClient(supabaseUrl, serviceKey)
}

async function record(
  eventId: string,
  recipient: string,
  messageId: string | null,
  reason: 'bounce' | 'complaint' | 'unsubscribe',
  status: 'bounced' | 'complained' | 'suppressed',
  errorMessage: string,
) {
  const supabase = getSupabase()
  const email = recipient.toLowerCase()

  const { error: suppressError } = await supabase
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })

  if (suppressError) {
    console.error('Failed to upsert suppressed email', {
      code: suppressError.code,
      message: suppressError.message,
      event_id: eventId,
    })
    throw new Error('Failed to write suppression')
  }

  const { error: logError } = await supabase.from('email_send_log').insert({
    message_id: messageId ?? null,
    template_name: 'system',
    recipient_email: email,
    status,
    error_message: errorMessage,
    metadata: null,
  })

  if (logError) {
    console.error('Failed to insert email_send_log', {
      code: logError.code,
      message: logError.message,
      event_id: eventId,
    })
    throw new Error('Failed to write send log')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await record(
        event.event_id,
        event.data.recipient,
        event.data.message_id ?? null,
        'bounce',
        'bounced',
        'Permanent bounce — email address is invalid or rejected',
      )
    },
    'email.complaint': async (event) => {
      await record(
        event.event_id,
        event.data.recipient,
        event.data.message_id ?? null,
        'complaint',
        'complained',
        'Spam complaint — recipient marked email as spam',
      )
    },
    'email.unsubscribed': async (event) => {
      await record(
        event.event_id,
        event.data.recipient,
        event.data.message_id ?? null,
        'unsubscribe',
        'suppressed',
        'Recipient unsubscribed',
      )
    },
  },
})

Deno.serve((req) => handler(req))
