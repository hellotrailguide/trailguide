'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useEditorStore } from '@/lib/stores/editor-store'
import { toast } from '@/components/ui/toast'

/**
 * Global listener for Chrome extension messages.
 * When a selector is picked via the extension, this component:
 * 1. Creates a new trail if none exists
 * 2. Creates a new step with the selector
 * 3. Navigates to the edit page
 */
export function ExtensionListener() {
  const router = useRouter()
  const pathname = usePathname()

  // Process a received selector
  const processSelector = (selector: string, sourceUrl?: string) => {
    console.log('[ExtensionListener] Processing selector:', selector, 'from:', sourceUrl)

    // Get current state
    const state = useEditorStore.getState()
    let trail = state.trail
    let isNewTrail = false

    // Create a new trail if we don't have one
    if (!trail) {
      trail = state.createNewTrail()
      isNewTrail = true
      console.log('[ExtensionListener] Created new trail:', trail.id)
    }

    // Set the preview URL
    if (sourceUrl) {
      state.setPreviewUrl(sourceUrl)
    }

    // Add a new step with the selector
    state.addStep({
      title: 'New Step',
      content: 'Describe this step...',
      target: selector,
      placement: 'bottom',
    })
    console.log('[ExtensionListener] Added step with selector')

    // Show success toast
    toast.success(`Element captured: ${selector.slice(0, 40)}${selector.length > 40 ? '...' : ''}`)

    // Navigate to the edit page
    router.push(`/edit/${trail.id}`)
  }

  useEffect(() => {
    console.log('[ExtensionListener] Setting up message listener, pathname:', pathname)

    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our own origin
      if (event.origin !== window.location.origin) return

      // Only handle TRAILGUIDE_SELECTOR messages
      if (event.data?.type !== 'TRAILGUIDE_SELECTOR') return

      const { selector, sourceUrl } = event.data
      if (!selector) return

      // Skip if already on an edit page - the PreviewPane handles it there
      if (pathname?.startsWith('/edit/')) {
        console.log('[ExtensionListener] On edit page, letting PreviewPane handle it')
        return
      }

      processSelector(selector, sourceUrl)
    }

    window.addEventListener('message', handleMessage)

    // Also check for pending selectors in localStorage/sessionStorage
    // This is a fallback if the postMessage didn't work
    const checkPendingSelector = () => {
      const pendingData = sessionStorage.getItem('trailguide_pending_selector')
      if (pendingData) {
        try {
          const { selector, sourceUrl } = JSON.parse(pendingData)
          sessionStorage.removeItem('trailguide_pending_selector')
          if (selector && !pathname?.startsWith('/edit/')) {
            processSelector(selector, sourceUrl)
          }
        } catch (e) {
          console.error('[ExtensionListener] Error parsing pending selector:', e)
        }
      }
    }

    // Check on mount and when pathname changes
    checkPendingSelector()

    return () => window.removeEventListener('message', handleMessage)
  }, [router, pathname])

  // This component renders nothing
  return null
}
