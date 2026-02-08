'use client'

import { useEffect, useCallback } from 'react'
import { useEditorStore } from '@/lib/stores/editor-store'
import { StepList } from './StepList'
import { StepEditPanel } from '../step-editor/StepEditPanel'
import { PreviewPane } from '../preview-pane/PreviewPane'
import { Toolbar } from './Toolbar'

export function TrailEditor() {
  const { trail, undo, redo, history, isDirty } = useEditorStore()

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        useEditorStore.getState().saveTrail()
      }
    },
    [undo, redo]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  if (!trail) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No trail selected
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Toolbar />
      <div className="flex-1 flex min-h-0">
        {/* Left panel - Step list */}
        <div className="w-72 border-r border-border flex flex-col">
          <StepList />
        </div>

        {/* Center - Preview */}
        <div className="flex-1 min-w-0">
          <PreviewPane />
        </div>

        {/* Right panel - Step editor */}
        <div className="w-80 border-l border-border">
          <StepEditPanel />
        </div>
      </div>
    </div>
  )
}
