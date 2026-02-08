'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save,
  Undo2,
  Redo2,
  Download,
  Upload,
  Play,
  ArrowLeft,
  Github,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useEditorStore } from '@/lib/stores/editor-store'
import { GitHubSyncModal } from './GitHubSyncModal'

export function Toolbar() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false)
  const {
    trail,
    isDirty,
    history,
    updateTrailMeta,
    saveTrail,
    exportTrail,
    importTrail,
    undo,
    redo,
    previewMode,
    setPreviewMode,
  } = useEditorStore()

  if (!trail) return null

  const handleExport = () => {
    const json = exportTrail()
    if (!json) return

    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${trail.id}.trail.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const json = event.target?.result as string
      const success = importTrail(json)
      if (!success) {
        alert('Invalid trail file. Please check the JSON format.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSave = () => {
    saveTrail()
  }

  return (
    <div className="h-14 border-b border-border flex items-center px-4 gap-4">
      {/* Back button */}
      <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* Trail title */}
      <Input
        value={trail.title}
        onChange={(e) => updateTrailMeta({ title: e.target.value })}
        className="w-64 font-medium"
      />

      {/* Save status */}
      {isDirty && (
        <Badge variant="outline" className="text-muted-foreground">
          Unsaved
        </Badge>
      )}

      <div className="flex-1" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={history.past.length === 0}
          title="Undo (Cmd+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={history.future.length === 0}
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Preview controls */}
      <div className="flex items-center gap-1">
        <Button
          variant={previewMode === 'play' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setPreviewMode(previewMode === 'play' ? 'edit' : 'play')}
        >
          <Play className="h-4 w-4 mr-1" />
          {previewMode === 'play' ? 'Stop' : 'Preview'}
        </Button>
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Import/Export */}
      <div className="flex items-center gap-1">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Import JSON">
          <Upload className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleExport} title="Export JSON">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-border" />

      {/* GitHub sync */}
      <Button variant="outline" size="sm" onClick={() => setIsGitHubModalOpen(true)}>
        <Github className="h-4 w-4 mr-1" />
        Sync
      </Button>

      {/* Save */}
      <Button onClick={handleSave} disabled={!isDirty}>
        <Save className="h-4 w-4 mr-1" />
        Save
      </Button>

      {/* GitHub Sync Modal */}
      <GitHubSyncModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />
    </div>
  )
}
