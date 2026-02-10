import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Trail, Step, Placement } from '@/lib/types/trail'

export type SelectorQuality = 'stable' | 'moderate' | 'fragile'

export interface EditorStep extends Step {
  selectorQuality?: SelectorQuality
  selectorQualityHint?: string
}

export interface EditorTrail extends Trail {
  createdAt: string
  updatedAt: string
  previewUrl?: string
  steps: EditorStep[]
}

interface HistoryState {
  past: EditorTrail[]
  future: EditorTrail[]
}

interface EditorState {
  // Current trail being edited
  trail: EditorTrail | null
  selectedStepIndex: number | null

  // All trails (local storage)
  trails: EditorTrail[]

  // History for undo/redo
  history: HistoryState

  // Preview state
  previewMode: 'edit' | 'play' | 'pick' | 'record'
  previewUrl: string

  // UI state
  isSaving: boolean
  isDirty: boolean

  // Actions
  setTrail: (trail: EditorTrail | null) => void
  selectStep: (index: number | null) => void

  // Step actions
  addStep: (step: Omit<Step, 'id'>) => void
  updateStep: (index: number, updates: Partial<Step>) => void
  removeStep: (index: number) => void
  reorderSteps: (fromIndex: number, toIndex: number) => void

  // Trail actions
  updateTrailMeta: (updates: Partial<Pick<EditorTrail, 'title' | 'previewUrl'>>) => void
  saveTrail: () => void
  loadTrail: (id: string) => void
  deleteTrail: (id: string) => void
  createNewTrail: () => EditorTrail
  duplicateTrail: (id: string) => void

  // Import/Export
  exportTrail: () => string | null
  importTrail: (json: string) => boolean

  // History
  undo: () => void
  redo: () => void
  pushHistory: () => void

  // Preview
  setPreviewMode: (mode: 'edit' | 'play' | 'pick' | 'record') => void
  setPreviewUrl: (url: string) => void
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function createEmptyTrail(): EditorTrail {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    title: 'Untitled Trail',
    version: '1.0.0',
    steps: [],
    createdAt: now,
    updatedAt: now,
    previewUrl: '',
  }
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      trail: null,
      selectedStepIndex: null,
      trails: [],
      history: { past: [], future: [] },
      previewMode: 'edit',
      previewUrl: '',
      isSaving: false,
      isDirty: false,

      setTrail: (trail) => set({ trail, selectedStepIndex: null, isDirty: false }),

      selectStep: (index) => set({ selectedStepIndex: index }),

      addStep: (stepData) => {
        const { trail, pushHistory } = get()
        if (!trail) return

        pushHistory()

        const newStep: Step = {
          ...stepData,
          id: generateId(),
        }

        set({
          trail: {
            ...trail,
            steps: [...trail.steps, newStep],
            updatedAt: new Date().toISOString(),
          },
          selectedStepIndex: trail.steps.length,
          isDirty: true,
        })
      },

      updateStep: (index, updates) => {
        const { trail, pushHistory } = get()
        if (!trail || index < 0 || index >= trail.steps.length) return

        pushHistory()

        const newSteps = [...trail.steps]
        newSteps[index] = { ...newSteps[index], ...updates }

        set({
          trail: {
            ...trail,
            steps: newSteps,
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })
      },

      removeStep: (index) => {
        const { trail, selectedStepIndex, pushHistory } = get()
        if (!trail || index < 0 || index >= trail.steps.length) return

        pushHistory()

        const newSteps = trail.steps.filter((_, i) => i !== index)
        let newSelectedIndex = selectedStepIndex

        if (selectedStepIndex !== null) {
          if (selectedStepIndex === index) {
            newSelectedIndex = newSteps.length > 0 ? Math.min(index, newSteps.length - 1) : null
          } else if (selectedStepIndex > index) {
            newSelectedIndex = selectedStepIndex - 1
          }
        }

        set({
          trail: {
            ...trail,
            steps: newSteps,
            updatedAt: new Date().toISOString(),
          },
          selectedStepIndex: newSelectedIndex,
          isDirty: true,
        })
      },

      reorderSteps: (fromIndex, toIndex) => {
        const { trail, selectedStepIndex, pushHistory } = get()
        if (!trail) return
        if (fromIndex < 0 || fromIndex >= trail.steps.length) return
        if (toIndex < 0 || toIndex >= trail.steps.length) return
        if (fromIndex === toIndex) return

        pushHistory()

        const newSteps = [...trail.steps]
        const [movedStep] = newSteps.splice(fromIndex, 1)
        newSteps.splice(toIndex, 0, movedStep)

        let newSelectedIndex = selectedStepIndex
        if (selectedStepIndex === fromIndex) {
          newSelectedIndex = toIndex
        } else if (selectedStepIndex !== null) {
          if (fromIndex < selectedStepIndex && toIndex >= selectedStepIndex) {
            newSelectedIndex = selectedStepIndex - 1
          } else if (fromIndex > selectedStepIndex && toIndex <= selectedStepIndex) {
            newSelectedIndex = selectedStepIndex + 1
          }
        }

        set({
          trail: {
            ...trail,
            steps: newSteps,
            updatedAt: new Date().toISOString(),
          },
          selectedStepIndex: newSelectedIndex,
          isDirty: true,
        })
      },

      updateTrailMeta: (updates) => {
        const { trail, pushHistory } = get()
        if (!trail) return

        pushHistory()

        set({
          trail: {
            ...trail,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        })
      },

      saveTrail: () => {
        const { trail, trails } = get()
        if (!trail) return

        const updatedTrail = {
          ...trail,
          updatedAt: new Date().toISOString(),
        }

        const existingIndex = trails.findIndex((t) => t.id === trail.id)
        let newTrails: EditorTrail[]

        if (existingIndex >= 0) {
          newTrails = [...trails]
          newTrails[existingIndex] = updatedTrail
        } else {
          newTrails = [...trails, updatedTrail]
        }

        set({
          trails: newTrails,
          trail: updatedTrail,
          isDirty: false,
        })
      },

      loadTrail: (id) => {
        const { trails } = get()
        const trail = trails.find((t) => t.id === id)
        if (trail) {
          set({
            trail,
            selectedStepIndex: null,
            history: { past: [], future: [] },
            previewUrl: trail.previewUrl || '',
            isDirty: false,
          })
        }
      },

      deleteTrail: (id) => {
        const { trails, trail } = get()
        const newTrails = trails.filter((t) => t.id !== id)
        set({
          trails: newTrails,
          trail: trail?.id === id ? null : trail,
        })
      },

      createNewTrail: () => {
        const newTrail = createEmptyTrail()
        set({
          trail: newTrail,
          selectedStepIndex: null,
          history: { past: [], future: [] },
          isDirty: true,
        })
        return newTrail
      },

      duplicateTrail: (id) => {
        const { trails } = get()
        const original = trails.find((t) => t.id === id)
        if (!original) return

        const now = new Date().toISOString()
        const duplicate: EditorTrail = {
          ...original,
          id: generateId(),
          title: `${original.title} (Copy)`,
          createdAt: now,
          updatedAt: now,
          steps: original.steps.map((s) => ({ ...s, id: generateId() })),
        }

        set({
          trails: [...trails, duplicate],
          trail: duplicate,
          selectedStepIndex: null,
          isDirty: true,
        })
      },

      exportTrail: () => {
        const { trail } = get()
        if (!trail) return null

        // Export clean Trail format (without editor metadata)
        const exportData: Trail = {
          id: trail.id,
          title: trail.title,
          version: trail.version,
          steps: trail.steps.map(({ selectorQuality, selectorQualityHint, ...step }) => step),
        }

        return JSON.stringify(exportData, null, 2)
      },

      importTrail: (json) => {
        try {
          const data = JSON.parse(json)

          // Validate required fields
          if (!data.id || !data.title || !Array.isArray(data.steps)) {
            return false
          }

          const now = new Date().toISOString()
          const importedTrail: EditorTrail = {
            id: generateId(), // Generate new ID to avoid conflicts
            title: data.title,
            version: data.version || '1.0.0',
            steps: data.steps.map((s: Step) => ({
              ...s,
              id: s.id || generateId(),
            })),
            createdAt: now,
            updatedAt: now,
            previewUrl: '',
          }

          const { trails } = get()
          set({
            trails: [...trails, importedTrail],
            trail: importedTrail,
            selectedStepIndex: null,
            history: { past: [], future: [] },
            isDirty: true,
          })

          return true
        } catch {
          return false
        }
      },

      pushHistory: () => {
        const { trail, history } = get()
        if (!trail) return

        set({
          history: {
            past: [...history.past.slice(-49), trail],
            future: [],
          },
        })
      },

      undo: () => {
        const { trail, history } = get()
        if (history.past.length === 0) return

        const previous = history.past[history.past.length - 1]
        const newPast = history.past.slice(0, -1)

        set({
          trail: previous,
          history: {
            past: newPast,
            future: trail ? [trail, ...history.future] : history.future,
          },
          isDirty: true,
        })
      },

      redo: () => {
        const { trail, history } = get()
        if (history.future.length === 0) return

        const next = history.future[0]
        const newFuture = history.future.slice(1)

        set({
          trail: next,
          history: {
            past: trail ? [...history.past, trail] : history.past,
            future: newFuture,
          },
          isDirty: true,
        })
      },

      setPreviewMode: (mode) => set({ previewMode: mode }),

      setPreviewUrl: (url) => {
        const { trail } = get()
        set({
          previewUrl: url,
          trail: trail ? { ...trail, previewUrl: url } : null,
        })
      },
    }),
    {
      name: 'trailguide-editor',
      partialize: (state) => ({
        trails: state.trails,
      }),
    }
  )
)
