import { ExtensionListener } from '@/components/ExtensionListener'
import { SubscriptionGuard } from '@/components/subscription'
import { DashboardShell } from '@/components/dashboard'
import { TourProvider } from '@/lib/contexts/tour-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TourProvider>
      <div className="flex h-screen">
        {/* Global listener for Chrome extension messages */}
        <ExtensionListener />

        {/* Dashboard shell with sidebar and help menu */}
        <DashboardShell>
          <SubscriptionGuard>{children}</SubscriptionGuard>
        </DashboardShell>
      </div>
    </TourProvider>
  )
}
