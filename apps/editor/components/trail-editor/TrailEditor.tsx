'use client'

import { useEffect, useCallback, useState } from 'react'
import { useEditorStore } from '@/lib/stores/editor-store'
import { StepList } from './StepList'
import { StepEditPanel } from '../step-editor/StepEditPanel'
import { Toolbar } from './Toolbar'
import { Code, FileText, Chrome } from 'lucide-react'

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

        {/* Center - Instructions / Extension prompt */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center bg-muted/30 p-8">
          <div className="max-w-md text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Chrome className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Use the Chrome Extension</h2>
            <p className="text-muted-foreground mb-6">
              To record and preview trails visually, use the Trailguide extension directly on your site.
            </p>
            <div className="bg-card border rounded-lg p-4 text-left text-sm">
              <p className="font-medium mb-2">How it works:</p>
              <ol className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">1.</span>
                  Install the extension from the /extension folder
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">2.</span>
                  Navigate to your app in the browser
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">3.</span>
                  Click the extension icon → Start Editing
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">4.</span>
                  Click elements to capture them as steps
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">5.</span>
                  Export JSON and import here to sync
                </li>
              </ol>
            </div>
          </div>
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
