'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useEditorStore } from '@/lib/stores/editor-store'
import { toast } from '@/components/ui/toast'

/**
 * Global listener for Chrome extension messages.
 * When a selector is picked via the extension while NOT on an edit page,
 * this component creates a new trail, adds the step, and navigates to edit.
 * (On the edit page, PreviewPane handles selectors directly.)
 */
export function ExtensionListener() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'TRAILGUIDE_SELECTOR') return

      const { selector, sourceUrl } = event.data
      if (!selector) return

      // Let PreviewPane handle it on the edit page
      if (pathname?.includes('/edit/')) return

      const state = useEditorStore.getState()
      let trail = state.trail

      if (!trail) {
        trail = state.createNewTrail()
      }

      if (sourceUrl) {
        state.setPreviewUrl(sourceUrl)
      }

      state.addStep({
        title: 'New Step',
        content: 'Describe this step...',
        target: selector,
        placement: 'bottom',
      })

      toast.success(`Element captured: ${selector.slice(0, 40)}${selector.length > 40 ? '...' : ''}`)
      router.push(`/dashboard/edit/${trail.id}`)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [router, pathname])

  return null
}
