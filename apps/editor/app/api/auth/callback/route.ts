import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      // Redirect to login with error
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data.user) {
      // Create or update profile with GitHub info
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          github_username: data.user.user_metadata?.user_name || null,
        })
      }

      // Ensure user has a subscription (trial created by trigger, but fallback here)
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', data.user.id)
        .single()

      if (!subscription) {
        // Create 14-day trial if no subscription exists
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + 14)

        await supabase.from('subscriptions').insert({
          user_id: data.user.id,
          status: 'trialing',
          current_period_end: trialEnd.toISOString(),
        })
      }

      // Redirect to intended destination
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // No code or auth failed - redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
