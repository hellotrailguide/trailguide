'use client'

import { ToastContainer } from '@/components/ui/toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  )
}
