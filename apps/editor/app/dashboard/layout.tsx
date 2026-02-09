import { ExtensionListener } from '@/components/ExtensionListener'
import { SubscriptionGuard } from '@/components/subscription'
import { DashboardShell } from '@/components/dashboard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      {/* Global listener for Chrome extension messages */}
      <ExtensionListener />

      {/* Dashboard shell with sidebar, help menu, and onboarding tour */}
      <DashboardShell>
        <SubscriptionGuard>{children}</SubscriptionGuard>
      </DashboardShell>
    </div>
  )
}
