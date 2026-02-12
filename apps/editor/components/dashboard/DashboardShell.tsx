'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, BarChart3, Settings, LogOut, Sun, Moon } from 'lucide-react'
import { HelpMenu, OnboardingTour, resetOnboardingTour } from '@/components/help'
import { Tooltip } from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/lib/hooks/useTheme'

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter()
  const [showTour, setShowTour] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleStartTour = () => {
    resetOnboardingTour()
    setShowTour(true)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Sidebar */}
      <aside className="w-16 border-r border-border flex flex-col items-center py-4 bg-card">
        <Link
          href="/"
          className="h-10 w-10 rounded-lg flex items-center justify-center mb-8"
          data-tour-target="logo"
        >
          <img src="/favicon.svg" alt="Trailguide" className="h-10 w-10" />
        </Link>

        <nav className="flex-1 flex flex-col items-center gap-2">
          <Tooltip content="Trails">
            <Link
              href="/dashboard"
              className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Home className="h-5 w-5" />
            </Link>
          </Tooltip>
          <Tooltip content="Analytics">
            <Link
              href="/dashboard/analytics"
              className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <BarChart3 className="h-5 w-5" />
            </Link>
          </Tooltip>
          <Tooltip content="Settings">
            <Link
              href="/dashboard/settings"
              className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </Tooltip>
        </nav>

        <div className="flex flex-col items-center gap-2">
          <div data-tour-target="help-button">
            <HelpMenu onStartTour={handleStartTour} />
          </div>
          <Tooltip content={theme === 'light' ? 'Dark mode' : 'Light mode'}>
            <button
              onClick={toggleTheme}
              className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </Tooltip>
          <Tooltip content="Sign Out">
            <button
              onClick={handleSignOut}
              className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>

      {/* Onboarding tour */}
      <OnboardingTour
        forceShow={showTour}
        onComplete={() => setShowTour(false)}
      />
    </>
  )
}
