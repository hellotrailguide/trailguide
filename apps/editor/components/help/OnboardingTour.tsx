'use client'

import { useState, useEffect } from 'react'
import { Trailguide } from '@trailguide/runtime'
import type { Trail } from '@trailguide/runtime'

// Import Trailguide styles
import '@trailguide/core/dist/style.css'

const ONBOARDING_TOUR: Trail = {
  id: 'editor-onboarding',
  title: 'Welcome to Trailguide',
  version: '1.0.0',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Trailguide!',
      content: "Let's take a quick tour of the editor. You'll be creating product tours in no time.",
      target: '[data-tour-target="logo"]',
      placement: 'right',
    },
    {
      id: 'url-input',
      title: 'Enter Your App URL',
      content: 'Start by entering your app\'s URL here. We\'ll load it in the preview so you can click elements to add them as tour steps.',
      target: '[data-tour-target="url-input"]',
      placement: 'bottom',
    },
    {
      id: 'pick-element',
      title: 'Pick Elements',
      content: 'After loading your app, click "Pick in Preview" to select any element. Click an element and it becomes a tour step!',
      target: '[data-tour-target="preview-area"]',
      placement: 'left',
    },
    {
      id: 'step-list',
      title: 'Your Tour Steps',
      content: 'Your steps appear here. Drag to reorder, click to edit. Each step targets an element in your app.',
      target: '[data-tour-target="step-list"]',
      placement: 'right',
    },
    {
      id: 'add-step',
      title: 'Add Steps Manually',
      content: 'You can also add steps manually if you prefer. Just enter the CSS selector for the target element.',
      target: '[data-tour-target="add-step-button"]',
      placement: 'right',
    },
    {
      id: 'edit-panel',
      title: 'Edit Step Content',
      content: 'Select a step to edit its title, content, and placement. Use the rich text editor for formatting.',
      target: '[data-tour-target="edit-panel"]',
      placement: 'left',
    },
    {
      id: 'save',
      title: 'Save Your Work',
      content: 'Don\'t forget to save! Your trails are stored locally and can be synced to GitHub.',
      target: '[data-tour-target="save-button"]',
      placement: 'bottom',
    },
    {
      id: 'sync',
      title: 'Sync with GitHub',
      content: 'Push your trails to GitHub as JSON files. Review changes in PRs just like code.',
      target: '[data-tour-target="sync-button"]',
      placement: 'bottom',
    },
    {
      id: 'done',
      title: 'You\'re Ready!',
      content: 'That\'s it! Enter a URL and start building your first product tour. Click the help icon anytime to restart this tour.',
      target: '[data-tour-target="help-button"]',
      placement: 'right',
    },
  ],
}

const TOUR_COMPLETED_KEY = 'trailguide_onboarding_completed'

interface OnboardingTourProps {
  forceShow?: boolean
  onComplete?: () => void
}

export function OnboardingTour({ forceShow = false, onComplete }: OnboardingTourProps) {
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    // Check if tour was already completed
    const completed = localStorage.getItem(TOUR_COMPLETED_KEY)
    if (!completed || forceShow) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => setShowTour(true), 500)
      return () => clearTimeout(timer)
    }
  }, [forceShow])

  const handleComplete = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true')
    setShowTour(false)
    onComplete?.()
  }

  const handleSkip = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true')
    setShowTour(false)
    onComplete?.()
  }

  if (!showTour) return null

  return (
    <Trailguide
      trail={ONBOARDING_TOUR}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  )
}

// Helper to manually trigger the tour
export function resetOnboardingTour() {
  localStorage.removeItem(TOUR_COMPLETED_KEY)
}
