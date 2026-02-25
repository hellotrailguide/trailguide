'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Github, Gitlab, Mail, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams?.get('redirectTo') || '/dashboard'
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [gitlabPopupOpen, setGitlabPopupOpen] = useState(false)

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      setSuccess(true)
      setIsLoading(false)
    }
  }

  const handleGitHubSignup = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        scopes: 'read:user user:email repo',
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  const handleGitLabSignup = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'gitlab',
      options: {
        redirectTo: `${window.location.origin}/api/auth/popup-callback`,
        scopes: 'api read_user',
        skipBrowserRedirect: true,
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    if (!data.url) {
      setError('Failed to start GitLab sign in')
      setIsLoading(false)
      return
    }

    const popup = window.open(data.url, 'gitlab-auth', 'width=500,height=700,left=200,top=100')

    if (!popup) {
      // Popup blocked — fall back to normal redirect
      window.location.href = data.url
      return
    }

    setGitlabPopupOpen(true)
    let popupCheck: ReturnType<typeof setInterval>

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'AUTH_COMPLETE') {
        window.removeEventListener('message', handleMessage)
        clearInterval(popupCheck)
        setGitlabPopupOpen(false)
        router.push('/dashboard')
        router.refresh()
      }
    }

    window.addEventListener('message', handleMessage)

    popupCheck = setInterval(() => {
      if (popup.closed) {
        clearInterval(popupCheck)
        window.removeEventListener('message', handleMessage)
        setGitlabPopupOpen(false)
        setIsLoading(false)
      }
    }, 500)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image src="/favicon.svg" alt="Trailguide" width={48} height={48} priority />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              {"We've sent a confirmation link to "}<strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Click the link in the email to verify your account and start using Trailguide Pro.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/favicon.svg" alt="Trailguide" className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Start building product tours in minutes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {gitlabPopupOpen && (
            <div className="p-3 text-sm text-muted-foreground bg-muted rounded-md text-center">
              Complete sign in in the popup window
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGitHubSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Github className="h-4 w-4 mr-2" />
            )}
            Continue with GitHub
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGitLabSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Gitlab className="h-4 w-4 mr-2" />
            )}
            Continue with GitLab
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Sign up with Email
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
