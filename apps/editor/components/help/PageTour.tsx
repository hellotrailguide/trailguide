'use client'

import { Trailguide } from '@trailguide/runtime'
import type { Trail } from '@trailguide/runtime'
import '@trailguide/core/dist/style.css'

interface PageTourProps {
  trail: Trail
  show: boolean
  onDismiss: () => void
}

export function PageTour({ trail, show, onDismiss }: PageTourProps) {
  if (!show) return null
  return <Trailguide trail={trail} onComplete={onDismiss} onSkip={onDismiss} />
}
