'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ExternalLink,
  RefreshCw,
  AlertCircle,
  MousePointer2,
  Video,
  Square,
  Play,
  ChevronLeft,
  ChevronRight,
  Puzzle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEditorStore } from '@/lib/stores/editor-store'
import type { SelectorQuality } from '@/lib/stores/editor-store'
import { toast } from '@/components/ui/toast'

export function PreviewPane() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [recordedCount, setRecordedCount] = useState(0)
  const [playbackStep, setPlaybackStep] = useState(0)

  const {
    trail,
    selectedStepIndex,
    previewUrl,
    previewMode,
    setPreviewUrl,
    updateStep,
    setPreviewMode,
    addStep,
    selectStep,
    createNewTrail,
  } = useEditorStore()

  // Send message to iframe
  const postToIframe = useCallback((message: object) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, '*')
    }
  }, [])

  // Handle messages from iframe — validate origin
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data?.type) return

      // Only accept messages from our own origin (proxied iframe) or the iframe itself
      if (event.origin !== window.location.origin && event.origin !== 'null') return

      switch (event.data.type) {
        case 'TRAILGUIDE_IFRAME_READY':
          console.log('[PreviewPane] Iframe picker ready')
          postToIframe({ type: 'TRAILGUIDE_EDITOR_CONFIRM' })
          break

        case 'TRAILGUIDE_SELECTOR': {
          const { selector, quality, qualityHint } = event.data
          if (!selector) return

          console.log('[PreviewPane] Received selector:', selector, 'quality:', quality)

          const currentMode = useEditorStore.getState().previewMode
          const currentTrail = useEditorStore.getState().trail

          // If no trail exists, create one first
          if (!currentTrail) {
            createNewTrail()
          }

          if (currentMode === 'record') {
            // In record mode: always add a new step
            addStep({
              title: 'Step ' + ((useEditorStore.getState().trail?.steps.length ?? 0) + 1),
              content: 'Describe this step...',
              target: selector,
              placement: 'bottom',
            })
            // Set quality on the newly added step
            const trailNow = useEditorStore.getState().trail
            if (trailNow && quality) {
              const newIdx = trailNow.steps.length - 1
              updateStep(newIdx, {
                selectorQuality: quality as SelectorQuality,
                selectorQualityHint: qualityHint || '',
              } as any)
            }
            setRecordedCount((c) => c + 1)
          } else {
            // Pick mode: update selected step or create new
            const currentSelectedStep = useEditorStore.getState().selectedStepIndex

            if (currentSelectedStep !== null) {
              updateStep(currentSelectedStep, {
                target: selector,
                selectorQuality: quality as SelectorQuality,
                selectorQualityHint: qualityHint || '',
              } as any)
            } else {
              const trailAfterCreate = useEditorStore.getState().trail
              if (trailAfterCreate && trailAfterCreate.steps.length > 0) {
                const lastIndex = trailAfterCreate.steps.length - 1
                selectStep(lastIndex)
                updateStep(lastIndex, {
                  target: selector,
                  selectorQuality: quality as SelectorQuality,
                  selectorQualityHint: qualityHint || '',
                } as any)
              } else {
                addStep({
                  title: 'New Step',
                  content: 'Describe this step...',
                  target: selector,
                  placement: 'bottom',
                })
                const trailNow2 = useEditorStore.getState().trail
                if (trailNow2 && quality) {
                  const newIdx = trailNow2.steps.length - 1
                  updateStep(newIdx, {
                    selectorQuality: quality as SelectorQuality,
                    selectorQualityHint: qualityHint || '',
                  } as any)
                }
              }
            }
            setPreviewMode('edit')
            toast.success(`Element selected: ${selector.slice(0, 35)}${selector.length > 35 ? '...' : ''}`)
          }
          break
        }

        case 'TRAILGUIDE_PICKER_STOPPED':
          setPreviewMode('edit')
          break

        case 'TRAILGUIDE_RECORDER_STOPPED':
          setPreviewMode('edit')
          setRecordedCount(0)
          break

        case 'TRAILGUIDE_PLAY_ENDED':
          setPreviewMode('edit')
          setPlaybackStep(0)
          break

        case 'TRAILGUIDE_PLAY_STEP_CHANGED':
          if (typeof event.data.stepIndex === 'number') {
            setPlaybackStep(event.data.stepIndex)
          }
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [postToIframe, updateStep, setPreviewMode, addStep, selectStep, createNewTrail])

  // Send picker/recording/play commands when mode changes
  useEffect(() => {
    if (!isLoaded) return

    if (previewMode === 'pick') {
      postToIframe({ type: 'TRAILGUIDE_START_PICKER' })
    } else if (previewMode === 'record') {
      postToIframe({ type: 'TRAILGUIDE_START_RECORDING' })
    } else {
      postToIframe({ type: 'TRAILGUIDE_STOP_PICKER' })
      postToIframe({ type: 'TRAILGUIDE_STOP_RECORDING' })
    }

    // Handle highlighting in edit mode
    if (previewMode === 'edit' && trail && selectedStepIndex !== null) {
      const step = trail.steps[selectedStepIndex]
      if (step?.target) {
        postToIframe({ type: 'TRAILGUIDE_HIGHLIGHT', selector: step.target })
      } else {
        postToIframe({ type: 'TRAILGUIDE_CLEAR_HIGHLIGHT' })
      }
    }
  }, [isLoaded, previewMode, trail, selectedStepIndex, postToIframe])

  const handleLoadUrl = () => {
    if (!urlInput) return
    let url = urlInput
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    setPreviewUrl(url)
    setIsLoaded(false)
    setError(null)
  }

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
      setIsLoaded(false)
    }
  }

  const handleIframeLoad = () => {
    setIsLoaded(true)
  }

  const handleIframeError = () => {
    setError('Failed to load preview. The site may not allow embedding.')
  }

  const handleStartPicking = () => {
    setPreviewMode('pick')
  }

  const handleStartRecording = () => {
    if (!previewUrl) {
      toast.error('Enter a URL first')
      return
    }
    if (!trail) {
      createNewTrail()
    }
    setRecordedCount(0)
    setPreviewMode('record')
  }

  const handleStopRecording = () => {
    postToIframe({ type: 'TRAILGUIDE_STOP_RECORDING' })
    setPreviewMode('edit')
    const count = recordedCount
    setRecordedCount(0)
    if (count > 0) {
      toast.success(`${count} step${count === 1 ? '' : 's'} captured`)
    }
  }

  const handleStartPlayback = () => {
    if (!trail || trail.steps.length === 0) return
    setPlaybackStep(0)
    setPreviewMode('play')
    postToIframe({ type: 'TRAILGUIDE_PLAY_TRAIL', trail })
  }

  const handleStopPlayback = () => {
    postToIframe({ type: 'TRAILGUIDE_STOP_TRAIL' })
    setPreviewMode('edit')
    setPlaybackStep(0)
  }

  const handlePlayPrev = () => {
    postToIframe({ type: 'TRAILGUIDE_PLAY_PREV' })
  }

  const handlePlayNext = () => {
    postToIframe({ type: 'TRAILGUIDE_PLAY_NEXT' })
  }

  // "Use Extension" — old window.open + localStorage flow
  const handleUseExtension = () => {
    if (!previewUrl) {
      toast.error('Enter a URL first')
      return
    }
    localStorage.setItem(
      'trailguide_recorder_request',
      JSON.stringify({ url: previewUrl, timestamp: Date.now() })
    )
    const newWindow = window.open(previewUrl, '_blank', 'width=1200,height=800')
    if (newWindow) {
      toast.success('Recording window opened! The extension will capture clicks.')
    } else {
      toast.error('Popup blocked. Please allow popups for this site.')
    }
  }

  const totalSteps = trail?.steps.length ?? 0

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* URL bar */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleLoadUrl()
          }}
          className="flex-1 flex gap-2"
        >
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter your app URL (e.g., https://myapp.com)"
            className="flex-1"
            data-tour-target="url-input"
          />
          <Button type="submit" variant="secondary" size="sm">
            Load
          </Button>
        </form>
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={!previewUrl}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        {previewUrl && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(previewUrl, '_blank')}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Status bar */}
      {previewUrl && (
        <div
          className={`flex items-center gap-2 px-4 py-2 text-sm ${
            previewMode === 'record'
              ? 'bg-red-50 text-red-800 border-b border-red-200'
              : previewMode === 'pick'
                ? 'bg-primary text-primary-foreground'
                : previewMode === 'play'
                  ? 'bg-violet-50 text-violet-800 border-b border-violet-200'
                  : 'bg-muted border-b border-border'
          }`}
        >
          {previewMode === 'record' ? (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-medium">Recording</span>
              <span className="text-red-600">
                {recordedCount} step{recordedCount === 1 ? '' : 's'} captured
              </span>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto bg-white"
                onClick={handleStopRecording}
              >
                <Square className="h-3 w-3 mr-1" />
                Stop Recording
              </Button>
            </>
          ) : previewMode === 'pick' ? (
            <>
              <MousePointer2 className="h-4 w-4 animate-pulse" />
              <span>Click any element to select it</span>
              <Button
                size="sm"
                variant="secondary"
                className="ml-auto"
                onClick={() => setPreviewMode('edit')}
              >
                Cancel
              </Button>
            </>
          ) : previewMode === 'play' ? (
            <>
              <Play className="h-4 w-4" />
              <span className="font-medium">
                Step {playbackStep + 1} of {totalSteps}
              </span>
              <div className="ml-auto flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePlayPrev}
                  disabled={playbackStep === 0}
                  className="bg-white"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePlayNext}
                  disabled={playbackStep >= totalSteps - 1}
                  className="bg-white"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStopPlayback}
                  className="bg-white"
                >
                  <Square className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">
                {isLoaded ? 'Preview loaded' : 'Loading preview...'}
              </span>
              <div className="ml-auto flex gap-2">
                {isLoaded && (
                  <>
                    <Button size="sm" variant="outline" onClick={handleStartPicking}>
                      <MousePointer2 className="h-3 w-3 mr-1" />
                      Pick in Preview
                    </Button>
                    <Button size="sm" variant="default" onClick={handleStartRecording}>
                      <Video className="h-3 w-3 mr-1" />
                      Start Recording
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStartPlayback}
                      disabled={totalSteps === 0}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Preview Trail
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Preview content */}
      <div className="flex-1 relative">
        {!previewUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="max-w-md">
              <Video className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-medium mb-2">Create your product tour</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your app URL above, then click elements to add them as tour steps.
              </p>
              <div className="bg-muted p-4 rounded-lg text-left">
                <p className="text-sm font-medium mb-2">How it works:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Enter your app URL and click Load</li>
                  <li>Click &ldquo;Start Recording&rdquo; to capture a flow</li>
                  <li>Click elements in the preview to add tour steps</li>
                  <li>Edit the step content in the sidebar</li>
                </ol>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <h3 className="font-medium mb-2">Failed to load preview</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="text-left bg-muted p-4 rounded-lg max-w-md">
              <p className="text-sm font-medium mb-2">Try these options:</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>
                  <strong>1. Check the URL</strong> - Make sure it&apos;s a valid, accessible URL
                </li>
                <li>
                  <strong>2. Try localhost</strong> - Use your local development server (e.g.,
                  http://localhost:3000)
                </li>
                <li>
                  <strong>3. Open directly</strong> - View the site in a new tab and use the recorder
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.open(previewUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open Site in New Tab
                  </Button>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={`/api/proxy?url=${encodeURIComponent(previewUrl)}`}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </>
        )}
      </div>

      {/* Use Extension footer */}
      {previewUrl && isLoaded && previewMode === 'edit' && (
        <div className="flex items-center justify-end px-4 py-1.5 border-t border-border bg-background">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleUseExtension}>
            <Puzzle className="h-3 w-3 mr-1" />
            Use Extension
          </Button>
        </div>
      )}
    </div>
  )
}
