import { createClient } from '@/lib/supabase/server'

export async function handleOAuthCallback(
  code: string | null,
  origin: string,
  successRedirect: string
): Promise<string> {
  if (!code) return `${origin}/login`

  const supabase = createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error)
    return `${origin}/login?error=${encodeURIComponent(error.message)}`
  }

  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single()

    if (!profile) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        vcs_username: data.user.user_metadata?.user_name || null,
        vcs_provider: data.user.app_metadata?.provider || null,
      })
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', data.user.id)
      .single()

    if (!subscription) {
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14)
      await supabase.from('subscriptions').insert({
        user_id: data.user.id,
        status: 'trialing',
        current_period_end: trialEnd.toISOString(),
      })
    }

    return `${origin}${successRedirect}`
  }

  return `${origin}/login`
}
