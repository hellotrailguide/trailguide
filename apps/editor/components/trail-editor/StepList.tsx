'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/lib/stores/editor-store'
import { StepCard } from './StepCard'

export function StepList() {
  const { trail, reorderSteps, addStep, selectStep, importTrail } = useEditorStore()
  const steps = trail?.steps || []

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = steps.findIndex((s) => s.id === active.id)
    const newIndex = steps.findIndex((s) => s.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderSteps(oldIndex, newIndex)
    }
  }

  const handleAddStep = () => {
    addStep({
      target: '',
      title: 'New Step',
      content: 'Step description',
      placement: 'bottom',
    })
    selectStep(steps.length)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          if (content) {
            const success = importTrail(content)
            if (!success) {
              alert('Invalid trail JSON file')
            }
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Steps</h2>
          <span className="text-xs text-muted-foreground">{steps.length} steps</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={handleAddStep} data-tour-target="add-step-button">
            <Plus className="h-4 w-4 mr-1" />
            Add Step
          </Button>
          <Button size="sm" variant="outline" onClick={handleImport} title="Import from JSON">
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-sm text-muted-foreground mb-2">No steps yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Add steps manually or record a flow in the preview pane.
            </p>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import Trail
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <StepCard key={step.id} step={step} index={index} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
