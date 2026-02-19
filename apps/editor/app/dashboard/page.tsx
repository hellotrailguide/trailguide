'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MoreVertical, Trash2, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEditorStore } from '@/lib/stores/editor-store'

export default function TrailsPage() {
  const router = useRouter()
  const { trails, createNewTrail, loadTrail, deleteTrail, duplicateTrail } = useEditorStore()

  const handleCreateNew = () => {
    const trail = createNewTrail()
    router.push(`/dashboard/edit/${trail.id}`)
  }

  const handleOpen = (id: string) => {
    loadTrail(id)
    router.push(`/dashboard/edit/${id}`)
  }

  const handleDuplicate = (id: string) => {
    duplicateTrail(id)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this trail?')) {
      deleteTrail(id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Trails</h1>
            <p className="text-muted-foreground">Create and manage your product tours</p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Trail
          </Button>
        </div>

        {trails.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No trails yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first product tour to get started
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Trail
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trails.map((trail) => (
              <Card
                key={trail.id}
                className="group cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onClick={() => handleOpen(trail.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{trail.title}</CardTitle>
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDuplicate(trail.id)}
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(trail.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    Updated {formatDate(trail.updatedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{trail.steps.length} steps</Badge>
                    <Badge variant="outline" className="text-xs">
                      v{trail.version}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
