'use client'

import { ToastContainer } from '@/components/ui/toast'
import { useTheme } from '@/lib/hooks/useTheme'

export function Providers({ children }: { children: React.ReactNode }) {
  useTheme()

  return (
    <>
      {children}
      <ToastContainer />
    </>
  )
}
