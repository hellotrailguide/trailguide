import Link from 'next/link'
import { Home, BarChart3, Settings, LogOut } from 'lucide-react'
import { ExtensionListener } from '@/components/ExtensionListener'
import { SubscriptionGuard } from '@/components/subscription'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      {/* Global listener for Chrome extension messages */}
      <ExtensionListener />
      {/* Sidebar */}
      <aside className="w-16 border-r border-border flex flex-col items-center py-4 bg-card">
        <Link
          href="/"
          className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center mb-8"
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

        <button
          className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </aside>

      {/* Main content with subscription guard */}
      <main className="flex-1 min-w-0 flex flex-col">
        <SubscriptionGuard>{children}</SubscriptionGuard>
      </main>
    </div>
  )
}
