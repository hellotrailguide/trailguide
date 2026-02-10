import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Require an authenticated user for an API route.
 * Returns the user if authenticated, or a 401 NextResponse.
 */
export async function requireAuth(): Promise<
  { user: User; error?: never } | { user?: never; error: NextResponse }
> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { user }
}
