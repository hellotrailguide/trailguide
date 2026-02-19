'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function PaywallModal() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Please sign in to continue')
        return
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      })

      const { url, error: apiError } = await response.json()

      if (apiError) {
        setError(apiError)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch {
      setError('Failed to start checkout')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - no click to dismiss */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2">Your trial has ended</h2>
          <p className="text-muted-foreground mb-6">
            Upgrade to Pro to continue building amazing product tours
          </p>

          {error && (
            <div className="p-3 mb-4 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium mb-3">Pro includes:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Visual drag-and-drop editor
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Analytics dashboard
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                GitHub sync with PR reviews
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Unlimited trails
              </li>
            </ul>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Upgrade to Pro'
            )}
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Your trails are safe. Upgrade anytime to access them again.
          </p>
        </div>
      </div>
    </div>
  )
}
