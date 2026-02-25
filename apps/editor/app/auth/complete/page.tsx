'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AuthComplete() {
  const router = useRouter()

  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({ type: 'AUTH_COMPLETE' }, window.location.origin)
      window.close()
    } else {
      router.replace('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Signing in...</span>
      </div>
    </div>
  )
}
