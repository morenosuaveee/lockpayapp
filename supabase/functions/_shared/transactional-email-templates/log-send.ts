import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * Appends a row to the app's email_send_log table. Notification/history only —
 * a failure here never changes the outcome of a send.
 */
export async function logEmailSend(entry: {
  templateName: string
  recipientEmail: string
  status: 'sent' | 'suppressed' | 'failed'
  errorMessage?: string | null
  messageId?: string | null
}): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    console.error('logEmailSend: missing Supabase environment configuration')
    return
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const { error } = await supabase.from('email_send_log').insert({
    message_id: entry.messageId ?? null,
    template_name: entry.templateName,
    recipient_email: entry.recipientEmail,
    status: entry.status,
    error_message: entry.errorMessage ?? null,
  })

  if (error) {
    console.error('logEmailSend: failed to write email_send_log', {
      code: error.code,
      message: error.message,
    })
  }
}

/** Sends via the managed helper and records the outcome in email_send_log. */
export async function sendAndLog(
  send: () => Promise<{ sent: boolean; reason?: string }>,
  entry: { templateName: string; recipientEmail: string }
): Promise<{ sent: boolean; reason?: string }> {
  try {
    const result = await send()
    if (result.sent) {
      await logEmailSend({ ...entry, status: 'sent' })
    } else {
      await logEmailSend({
        ...entry,
        status: 'suppressed',
        errorMessage: result.reason ?? 'recipient_suppressed',
      })
    }
    return result
  } catch (error) {
    await logEmailSend({
      ...entry,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}
