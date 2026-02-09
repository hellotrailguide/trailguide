'use client'

import { useEffect, useCallback, useState } from 'react'
import { useEditorStore } from '@/lib/stores/editor-store'
import { StepList } from './StepList'
import { StepEditPanel } from '../step-editor/StepEditPanel'
import { Toolbar } from './Toolbar'
import { PreviewPane } from '../preview-pane/PreviewPane'
import { Code, FileText } from 'lucide-react'

export function TrailEditor() {
  const { trail, undo, redo, isDirty } = useEditorStore()
  const [rightTab, setRightTab] = useState<'edit' | 'json'>('edit')

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

  const jsonOutput = JSON.stringify(
    {
      id: trail.id,
      title: trail.title,
      version: trail.version,
      steps: trail.steps,
    },
    null,
    2
  )

  return (
    <div className="flex flex-col h-full">
      <Toolbar />
      <div className="flex-1 flex min-h-0">
        {/* Left panel - Step list */}
        <div className="w-80 border-r border-border flex flex-col">
          <StepList />
        </div>

        {/* Center - Preview pane with URL input and element picker */}
        <div className="flex-1 min-w-0">
          <PreviewPane />
        </div>

        {/* Right panel - Edit / JSON tabs */}
        <div className="w-96 border-l border-border flex flex-col">
          {/* Tab buttons */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setRightTab('edit')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                rightTab === 'edit'
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-4 w-4" />
              Edit Step
            </button>
            <button
              onClick={() => setRightTab('json')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                rightTab === 'json'
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code className="h-4 w-4" />
              JSON
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {rightTab === 'edit' ? (
              <StepEditPanel />
            ) : (
              <div className="h-full p-4 overflow-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Trail JSON</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(jsonOutput)
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Copy to clipboard
                  </button>
                </div>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[calc(100vh-280px)] font-mono">
                  {jsonOutput}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
