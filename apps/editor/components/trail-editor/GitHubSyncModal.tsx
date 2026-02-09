'use client'

import { useState, useEffect } from 'react'
import {
  Github,
  Loader2,
  Check,
  GitPullRequest,
  GitCommit,
  FolderGit2,
  ExternalLink,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useEditorStore } from '@/lib/stores/editor-store'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: { login: string }
  default_branch: string
  private: boolean
}

interface GitHubTrail {
  name: string
  path: string
  sha: string
}

interface GitHubSyncModalProps {
  isOpen: boolean
  onClose: () => void
}

type SyncMode = 'save' | 'load'
type SaveMethod = 'commit' | 'pr'

export function GitHubSyncModal({ isOpen, onClose }: GitHubSyncModalProps) {
  const { trail, exportTrail, importTrail } = useEditorStore()

  const [mode, setMode] = useState<SyncMode>('save')
  const [saveMethod, setSaveMethod] = useState<SaveMethod>('commit')

  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [trails, setTrails] = useState<GitHubTrail[]>([])

  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [isLoadingTrails, setIsLoadingTrails] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [filePath, setFilePath] = useState('')
  const [commitMessage, setCommitMessage] = useState('')
  const [prTitle, setPrTitle] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ type: string; url?: string } | null>(null)
  const [isLoadingTrail, setIsLoadingTrail] = useState(false)

  // Load repos on open
  useEffect(() => {
    if (isOpen) {
      loadRepos()
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setSuccess(null)
    }
  }, [isOpen])

  // Set default file path when trail changes
  useEffect(() => {
    if (trail) {
      setFilePath(`trails/${trail.id}.trail.json`)
      setCommitMessage(`Update ${trail.title}`)
      setPrTitle(`Update trail: ${trail.title}`)
    }
  }, [trail])

  // Load trails when repo is selected
  useEffect(() => {
    if (selectedRepo) {
      loadTrails(selectedRepo)
    }
  }, [selectedRepo])

  const loadRepos = async () => {
    setIsLoadingRepos(true)
    setError(null)

    try {
      const response = await fetch('/api/github/repos')
      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setRepos(data.repos || [])
      }
    } catch {
      setError('Failed to load repositories')
    } finally {
      setIsLoadingRepos(false)
    }
  }

  const loadTrails = async (repo: GitHubRepo) => {
    setIsLoadingTrails(true)

    try {
      const response = await fetch(
        `/api/github/trails?owner=${repo.owner.login}&repo=${repo.name}`
      )
      const data = await response.json()

      if (!data.error) {
        setTrails(data.trails || [])
      }
    } catch {
      // Ignore errors loading trails
    } finally {
      setIsLoadingTrails(false)
    }
  }

  const handleLoadTrail = async (trailFile: GitHubTrail) => {
    if (!selectedRepo) return

    setIsLoadingTrail(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/github/trails?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&path=${encodeURIComponent(trailFile.path)}`
      )
      const { content, error: apiError } = await response.json()

      if (apiError) {
        throw new Error(apiError)
      }

      const success = importTrail(JSON.stringify(content))
      if (!success) {
        throw new Error('Invalid trail format')
      }

      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trail from GitHub')
    } finally {
      setIsLoadingTrail(false)
    }
  }

  const handleSave = async () => {
    if (!selectedRepo || !trail || !filePath || !commitMessage) {
      setError('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const trailJson = exportTrail()
      if (!trailJson) {
        setError('Failed to export trail')
        return
      }

      const response = await fetch('/api/github/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          path: filePath,
          content: JSON.parse(trailJson),
          message: commitMessage,
          createPR: saveMethod === 'pr',
          prTitle: saveMethod === 'pr' ? prTitle : undefined,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setSuccess({
          type: data.type,
          url: data.type === 'pr' ? data.pr?.url : data.commit?.url,
        })
      }
    } catch {
      setError('Failed to save to GitHub')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            <h2 className="font-semibold">GitHub Sync</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'save' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('save')}
            >
              Save to GitHub
            </Button>
            <Button
              variant={mode === 'load' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('load')}
            >
              Load from GitHub
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>
                  {success.type === 'pr' ? 'Pull request created!' : 'Changes committed!'}
                </span>
              </div>
              {success.url && (
                <a
                  href={success.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs mt-2 text-green-600 hover:underline"
                >
                  View on GitHub
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {/* Repository selector */}
          <div className="space-y-2">
            <Label>Repository</Label>
            {isLoadingRepos ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading repositories...
              </div>
            ) : repos.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {"No repositories found. Make sure you've connected GitHub with repo access."}
              </div>
            ) : (
              <Select
                value={selectedRepo?.full_name || ''}
                onChange={(e) => {
                  const repo = repos.find((r) => r.full_name === e.target.value)
                  setSelectedRepo(repo || null)
                }}
              >
                <option value="">Select a repository...</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.full_name}>
                    {repo.full_name} {repo.private && '(private)'}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {mode === 'save' && selectedRepo && (
            <>
              {/* Save method */}
              <div className="space-y-2">
                <Label>Save Method</Label>
                <div className="flex gap-2">
                  <Button
                    variant={saveMethod === 'commit' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setSaveMethod('commit')}
                    className="flex-1"
                  >
                    <GitCommit className="h-4 w-4 mr-1" />
                    Direct Commit
                  </Button>
                  <Button
                    variant={saveMethod === 'pr' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setSaveMethod('pr')}
                    className="flex-1"
                  >
                    <GitPullRequest className="h-4 w-4 mr-1" />
                    Create PR
                  </Button>
                </div>
              </div>

              {/* File path */}
              <div className="space-y-2">
                <Label htmlFor="filePath">File Path</Label>
                <Input
                  id="filePath"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="trails/my-tour.trail.json"
                />
              </div>

              {/* Commit message */}
              <div className="space-y-2">
                <Label htmlFor="commitMessage">
                  {saveMethod === 'pr' ? 'Commit Message' : 'Commit Message'}
                </Label>
                <Input
                  id="commitMessage"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Update product tour"
                />
              </div>

              {/* PR title (only for PR mode) */}
              {saveMethod === 'pr' && (
                <div className="space-y-2">
                  <Label htmlFor="prTitle">PR Title</Label>
                  <Input
                    id="prTitle"
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    placeholder="Update: Product tour"
                  />
                </div>
              )}
            </>
          )}

          {mode === 'load' && selectedRepo && (
            <div className="space-y-2">
              <Label>Available Trails</Label>
              {isLoadingTrails ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning for trails...
                </div>
              ) : trails.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No trail files found. Looking for *.trail.json files.
                </div>
              ) : (
                <div className="space-y-2">
                  {trails.map((t) => (
                    <button
                      key={t.path}
                      className="w-full flex items-center gap-2 p-3 text-left border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                      onClick={() => handleLoadTrail(t)}
                      disabled={isLoadingTrail}
                    >
                      {isLoadingTrail ? (
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                      ) : (
                        <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-mono">{t.path}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {mode === 'save' && (
            <Button onClick={handleSave} disabled={!selectedRepo || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {saveMethod === 'pr' ? (
                    <GitPullRequest className="h-4 w-4 mr-2" />
                  ) : (
                    <GitCommit className="h-4 w-4 mr-2" />
                  )}
                  {saveMethod === 'pr' ? 'Create PR' : 'Commit'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
