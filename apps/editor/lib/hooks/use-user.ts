'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserState {
  user: User | null
  isLoading: boolean
}

export function useUser(): UserState {
  const [state, setState] = useState<UserState>({
    user: null,
    isLoading: true,
  })

  useEffect(() => {
    const supabase = createClient()

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState({ user, isLoading: false })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ user: session?.user ?? null, isLoading: false })
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return state
}
