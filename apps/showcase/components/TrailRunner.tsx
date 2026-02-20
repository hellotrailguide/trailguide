'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Trailguide } from '@trailguide/runtime'
import type { Trail } from '@trailguide/runtime'

interface TrailRunnerProps {
  tourName?: string | null
  onClose?: () => void
}

function TrailRunnerInner({ tourName, onClose }: TrailRunnerProps) {
  const [trail, setTrail] = useState<Trail | null>(null)
  const searchParams = useSearchParams()
  const initialUrlTour = useRef(searchParams.get('tour'))

  // Load tour from ?tour= URL param once on mount
  useEffect(() => {
    const name = initialUrlTour.current
    if (!name) return
    let cancelled = false
    fetch(`/tours/${name}.json`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`Tour not found: ${name}`))))
      .then((data: Trail) => { if (!cancelled) setTrail(data) })
      .catch(console.error)
    return () => { cancelled = true }
  }, [])

  // Load tour when triggered via help menu
  useEffect(() => {
    if (!tourName) return
    let cancelled = false
    fetch(`/tours/${tourName}.json`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`Tour not found: ${tourName}`))))
      .then((data: Trail) => { if (!cancelled) setTrail(data) })
      .catch(console.error)
    return () => { cancelled = true }
  }, [tourName])

  function handleClose() {
    setTrail(null)
    onClose?.()
  }

  if (!trail) return null

  return <Trailguide trail={trail} onComplete={handleClose} onSkip={handleClose} />
}

export function TrailRunner(props: TrailRunnerProps) {
  return (
    <Suspense>
      <TrailRunnerInner {...props} />
    </Suspense>
  )
}
