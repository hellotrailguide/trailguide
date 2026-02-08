'use client'

import { useState, useEffect } from 'react'
import { Target, MousePointer2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useEditorStore } from '@/lib/stores/editor-store'
import { RichTextEditor } from './RichTextEditor'
import { SelectorRepair } from './SelectorRepair'

interface SelectorStatus {
  isBroken: boolean
  suggestions: Array<{ selector: string; confidence: number; reason: string }>
}

export function StepEditPanel() {
  const { trail, selectedStepIndex, updateStep, setPreviewMode, previewMode, previewUrl } = useEditorStore()
  const [selectorStatus, setSelectorStatus] = useState<SelectorStatus>({
    isBroken: false,
    suggestions: [],
  })

  if (!trail || selectedStepIndex === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Target className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Select a step to edit</p>
      </div>
    )
  }

  const step = trail.steps[selectedStepIndex]
  if (!step) return null

  const handleUpdate = (field: string, value: string) => {
    updateStep(selectedStepIndex, { [field]: value })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold">Edit Step {selectedStepIndex + 1}</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={step.title}
            onChange={(e) => handleUpdate('title', e.target.value)}
            placeholder="Step title"
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <RichTextEditor
            value={step.content}
            onChange={(value) => handleUpdate('content', value)}
          />
        </div>

        {/* Target Selector */}
        <div className="space-y-2">
          <Label htmlFor="target">Target Selector</Label>
          <div className="flex gap-2">
            <Input
              id="target"
              value={step.target}
              onChange={(e) => handleUpdate('target', e.target.value)}
              placeholder="CSS selector (e.g., #my-button)"
              className="font-mono text-sm"
            />
            <Button
              variant={previewMode === 'pick' ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setPreviewMode(previewMode === 'pick' ? 'edit' : 'pick')}
              title="Pick element visually"
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Click the picker button, then click an element in the preview
          </p>
          {step.target && previewUrl && (
            <SelectorRepair
              selector={step.target}
              isBroken={selectorStatus.isBroken}
              suggestions={selectorStatus.suggestions}
              onRepair={(newSelector) => handleUpdate('target', newSelector)}
              onRefresh={() => {
                // Trigger selector validation via postMessage to iframe
                // This would be handled by the preview pane
              }}
            />
          )}
        </div>

        {/* Placement */}
        <div className="space-y-2">
          <Label htmlFor="placement">Placement</Label>
          <Select
            id="placement"
            value={step.placement}
            onChange={(e) => handleUpdate('placement', e.target.value)}
          >
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </Select>
        </div>

        {/* Advanced Options */}
        <details className="border border-border rounded-lg">
          <summary className="px-4 py-2 text-sm font-medium cursor-pointer hover:bg-muted">
            Advanced Options
          </summary>
          <div className="p-4 pt-2 space-y-4 border-t border-border">
            {/* Action */}
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select
                id="action"
                value={step.action || 'none'}
                onChange={(e) => handleUpdate('action', e.target.value)}
              >
                <option value="none">None</option>
                <option value="click">Click</option>
                <option value="input">Input</option>
                <option value="hover">Hover</option>
              </Select>
              <p className="text-xs text-muted-foreground">
                Action to simulate when step is shown
              </p>
            </div>

            {/* Next Trigger */}
            <div className="space-y-2">
              <Label htmlFor="nextOn">Advance On</Label>
              <Select
                id="nextOn"
                value={step.nextOn || 'click'}
                onChange={(e) => handleUpdate('nextOn', e.target.value)}
              >
                <option value="click">Button Click</option>
                <option value="manual">Manual (User Action)</option>
              </Select>
              <p className="text-xs text-muted-foreground">
                How user advances to next step
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}
