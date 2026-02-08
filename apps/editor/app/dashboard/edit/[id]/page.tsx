'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TrailEditor } from '@/components/trail-editor/TrailEditor'
import { useEditorStore } from '@/lib/stores/editor-store'

export default function EditTrailPage() {
  const params = useParams()
  const router = useRouter()
  const { trail, trails, loadTrail, createNewTrail } = useEditorStore()

  const trailId = params?.id as string | undefined

  useEffect(() => {
    if (!trailId) {
      router.push('/dashboard')
      return
    }

    if (trailId === 'new') {
      // Create a new trail if not already editing one
      if (!trail) {
        createNewTrail()
      }
    } else {
      // Load existing trail if not already loaded
      if (!trail || trail.id !== trailId) {
        const existingTrail = trails.find((t) => t.id === trailId)
        if (existingTrail) {
          loadTrail(trailId)
        } else {
          // Trail not found, redirect to home
          router.push('/dashboard')
        }
      }
    }
  }, [trailId, trail, trails, loadTrail, createNewTrail, router])

  return (
    <div className="h-full">
      <TrailEditor />
    </div>
  )
}
