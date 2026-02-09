'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Home, BarChart3, Settings, LogOut } from 'lucide-react'
import { HelpMenu, OnboardingTour, resetOnboardingTour } from '@/components/help'

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [showTour, setShowTour] = useState(false)

  const handleStartTour = () => {
    resetOnboardingTour()
    setShowTour(true)
  }

  return (
    <>
      {/* Sidebar */}
      <aside className="w-16 border-r border-border flex flex-col items-center py-4 bg-card">
        <Link
          href="/"
          className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center mb-8"
          data-tour-target="logo"
        >
          <span className="text-primary-foreground font-bold text-sm">T</span>
        </Link>

        <nav className="flex-1 flex flex-col items-center gap-2">
          <Link
            href="/dashboard"
            className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Trails"
          >
            <Home className="h-5 w-5" />
          </Link>
          <Link
            href="/dashboard/analytics"
            className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Analytics"
          >
            <BarChart3 className="h-5 w-5" />
          </Link>
          <Link
            href="/dashboard/settings"
            className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </nav>

        <div className="flex flex-col items-center gap-2">
          <div data-tour-target="help-button">
            <HelpMenu onStartTour={handleStartTour} />
          </div>
          <button
            className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
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
