'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Target, AlertCircle } from 'lucide-react'
import type { Step } from '@/lib/types/trail'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/lib/stores/editor-store'

interface StepCardProps {
  step: Step
  index: number
}

export function StepCard({ step, index }: StepCardProps) {
  const { selectedStepIndex, selectStep, removeStep } = useEditorStore()
  const isSelected = selectedStepIndex === index
  const hasTarget = step.target && step.target.trim() !== ''

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-start gap-2 p-3 rounded-lg border bg-card cursor-pointer transition-colors',
        isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-muted-foreground/50',
        isDragging && 'opacity-50'
      )}
      onClick={() => selectStep(index)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-0.5"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Step number */}
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
        {index + 1}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium truncate">{step.title || 'Untitled Step'}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              removeStep(index)
            }}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {step.content || 'No description'}
        </p>

        {/* Target indicator */}
        <div className="flex items-center gap-1 mt-2">
          {hasTarget ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <code className="bg-muted px-1 rounded truncate max-w-[150px]">{step.target}</code>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>No target selected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
