'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CreditCard, Github, User, Check, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useSubscription } from '@/lib/hooks/use-subscription'

interface UserInfo {
  email: string | null
  githubUsername: string | null
}

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subscription = useSubscription()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const success = searchParams?.get('success')
  const canceled = searchParams?.get('canceled')

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUser({
        email: user.email || null,
        githubUsername: user.user_metadata?.user_name || null,
      })

      setIsLoadingUser(false)
    }

    loadUser()
  }, [router])

  const handleUpgrade = async () => {
    setIsCheckingOut(true)
    try {
      const response = await fetch('/api/stripe/checkout', { method: 'POST' })
      const { url, error } = await response.json()

      if (error) {
        alert(error)
        return
      }

      window.location.href = url
    } catch {
      alert('Failed to start checkout')
    } finally {
      setIsCheckingOut(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url, error } = await response.json()

      if (error) {
        alert(error)
        return
      }

      window.location.href = url
    } catch {
      alert('Failed to open billing portal')
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoadingUser || subscription.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span className="font-medium">Payment successful!</span>
            </div>
            <p className="text-sm mt-1">
              Welcome to Trailguide Pro. You now have access to all features.
            </p>
          </div>
        )}

        {canceled && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <span className="font-medium">Checkout canceled.</span>
            <p className="text-sm mt-1">
              No worries! You can upgrade anytime.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-sm text-muted-foreground">{user?.email || 'Not set'}</p>
              </div>
              {user?.githubUsername && (
                <div>
                  <label className="text-sm font-medium">GitHub</label>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Github className="h-4 w-4" />
                    {user.githubUsername}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </CardFooter>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>Manage your Trailguide Pro subscription</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription.isPro ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Pro</Badge>
                    <span className="text-sm text-muted-foreground">
                      {subscription.isTrialing ? 'Trial active' : 'Active subscription'}
                    </span>
                  </div>
                  {subscription.currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground">
                      {subscription.isTrialing ? 'Trial ends' : 'Next billing date'}:{' '}
                      {subscription.currentPeriodEnd.toLocaleDateString()}
                    </p>
                  )}
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-2">Pro features include:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        GitHub sync
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Analytics dashboard
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Selector auto-repair
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Priority support
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Free</Badge>
                    <span className="text-sm text-muted-foreground">Local editing only</span>
                  </div>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">Upgrade to Pro</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Get GitHub sync, analytics, and more.
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">$29</p>
                        <p className="text-xs text-muted-foreground">per month</p>
                      </div>
                    </div>
                    <ul className="text-sm text-muted-foreground mt-4 space-y-1">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Sync trails to GitHub repositories
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Analytics dashboard with completion rates
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Automatic selector repair suggestions
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Priority email support
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {subscription.status === 'active' ? (
                <Button variant="outline" onClick={handleManageSubscription}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              ) : subscription.isTrialing ? (
                <Button onClick={handleUpgrade} disabled={isCheckingOut}>
                  {isCheckingOut ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Upgrade to Pro
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button onClick={handleUpgrade} disabled={isCheckingOut}>
                    {isCheckingOut ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Start 14 Days of Pro
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    No credit card required
                  </p>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
