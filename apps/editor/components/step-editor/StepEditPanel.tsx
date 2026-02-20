'use client'

import { useState } from 'react'
import { Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useEditorStore } from '@/lib/stores/editor-store'
import type { EditorStep } from '@/lib/stores/editor-store'
import { RichTextEditor } from './RichTextEditor'
import { SelectorRepair } from './SelectorRepair'

interface SelectorStatus {
  isBroken: boolean
  suggestions: Array<{ selector: string; confidence: number; reason: string }>
}

function SelectorQualityBadge({ step }: { step: EditorStep }) {
  if (!step.selectorQuality) return null

  const config = {
    stable: {
      label: 'Stable',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
    moderate: {
      label: 'Moderate',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    fragile: {
      label: 'Fragile — may break',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    },
  }[step.selectorQuality]

  if (!config) return null

  return (
    <div className="mt-1 space-y-1">
      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${config.className}`}>
        {config.label}
      </span>
      {step.selectorQuality === 'fragile' && step.selectorQualityHint && (
        <p className="text-xs text-destructive">{step.selectorQualityHint}</p>
      )}
    </div>
  )
}

export function StepEditPanel() {
  const { trail, selectedStepIndex, updateStep, previewUrl } = useEditorStore()
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

  const step = trail.steps[selectedStepIndex] as EditorStep | undefined
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
            key={step.id}
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
          </div>
          <p className="text-xs text-muted-foreground">
            Use &ldquo;Start Recording&rdquo; to visually select elements
          </p>
          <SelectorQualityBadge step={step} />
          {step.target && previewUrl && (
            <SelectorRepair
              selector={step.target}
              isBroken={selectorStatus.isBroken}
              suggestions={selectorStatus.suggestions}
              onRepair={(newSelector) => handleUpdate('target', newSelector)}
              onRefresh={() => {
                // Trigger selector validation via postMessage to iframe
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

      </div>
    </div>
  )
}
