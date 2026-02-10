'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Video,
  Square,
  Play,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEditorStore } from '@/lib/stores/editor-store'
import type { SelectorQuality } from '@/lib/stores/editor-store'
import { toast } from '@/components/ui/toast'

export function PreviewPane() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const recordWindowRef = useRef<Window | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [recordedCount, setRecordedCount] = useState(0)
  const [playbackStep, setPlaybackStep] = useState(0)
  const [pendingStep, setPendingStep] = useState<{ selector: string; quality: SelectorQuality; qualityHint: string } | null>(null);
  const [extensionInstalled, setExtensionInstalled] = useState(false);

  const {
    trail,
    selectedStepIndex,
    previewUrl,
    previewMode,
    setPreviewUrl,
    updateStep,
    setPreviewMode,
    addStep,
    createNewTrail,
  } = useEditorStore()

  // Send message to iframe (for playback)
  const postToIframe = useCallback((message: object) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, '*')
    }
  }, [])

  // Ping for extension on mount
  useEffect(() => {
    window.postMessage({ type: 'TRAILGUIDE_EXT_PING' }, '*')
  }, [])

  // Handle messages from iframe, recording window, or extension bridge
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data?.type) return

      // Extension bridge messages come from same page (origin matches)
      // Proxy iframe/window messages come from our origin too
      if (event.origin !== window.location.origin && event.origin !== 'null') return

      switch (event.data.type) {
        case 'TRAILGUIDE_EXT_INSTALLED':
          setExtensionInstalled(true)
          break

        case 'TRAILGUIDE_IFRAME_READY':
          // If this is from the proxy recording window, auto-start recording
          if (recordWindowRef.current && event.source === recordWindowRef.current) {
            console.log('[PreviewPane] Recording window ready, starting recording')
            recordWindowRef.current.postMessage({ type: 'TRAILGUIDE_EDITOR_CONFIRM' }, window.location.origin)
            recordWindowRef.current.postMessage({ type: 'TRAILGUIDE_START_RECORDING' }, window.location.origin)
          } else {
            console.log('[PreviewPane] Iframe picker ready')
            postToIframe({ type: 'TRAILGUIDE_EDITOR_CONFIRM' })
          }
          break

        case 'TRAILGUIDE_SELECTOR': {
          const { selector, quality, qualityHint } = event.data
          if (!selector) return

          console.log('[PreviewPane] Received selector:', selector, 'quality:', quality)
          setPendingStep({ selector, quality, qualityHint });
          break
        }

        case 'TRAILGUIDE_RECORDER_STOPPED':
          if (recordWindowRef.current) {
            recordWindowRef.current = null
          }
          setPreviewMode('edit')
          const stoppedCount = recordedCount
          setRecordedCount(0)
          if (stoppedCount > 0) {
            toast.success(`${stoppedCount} step${stoppedCount === 1 ? '' : 's'} captured`)
          }
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
  }, [postToIframe, setPreviewMode, recordedCount, toast])

  // Process received selectors — add steps during recording
  useEffect(() => {
    if (!pendingStep) return;

    const { selector, quality, qualityHint } = pendingStep;
    const currentTrail = useEditorStore.getState().trail;

    if (!currentTrail) {
      createNewTrail();
    }

    addStep({
      title: 'Step ' + ((useEditorStore.getState().trail?.steps.length ?? 0) + 1),
      content: 'Describe this step...',
      target: selector,
      placement: 'bottom',
    });

    const trailNow = useEditorStore.getState().trail;
    if (trailNow && quality) {
      const newIdx = trailNow.steps.length - 1;
      updateStep(newIdx, {
        selectorQuality: quality as SelectorQuality,
        selectorQualityHint: qualityHint || '',
      } as any);
    }
    setRecordedCount((c) => c + 1);

    toast.success(`Element selected: ${selector.slice(0, 35)}${selector.length > 35 ? '...' : ''}`);
    setPendingStep(null);
  }, [pendingStep, updateStep, addStep, createNewTrail, toast]);

  // Handle highlighting in iframe for playback/edit
  useEffect(() => {
    if (!isLoaded) return

    if (previewMode === 'edit' && trail && selectedStepIndex !== null) {
      const step = trail.steps[selectedStepIndex]
      if (step?.target) {
        postToIframe({ type: 'TRAILGUIDE_HIGHLIGHT', selector: step.target })
      } else {
        postToIframe({ type: 'TRAILGUIDE_CLEAR_HIGHLIGHT' })
      }
    }
  }, [isLoaded, previewMode, trail, selectedStepIndex, postToIframe])

  // Detect recording window close
  useEffect(() => {
    if (previewMode !== 'record' || !recordWindowRef.current) return

    const interval = setInterval(() => {
      if (recordWindowRef.current?.closed) {
        recordWindowRef.current = null
        setPreviewMode('edit')
        const count = recordedCount
        setRecordedCount(0)
        if (count > 0) {
          toast.success(`${count} step${count === 1 ? '' : 's'} captured`)
        }
      }
    }, 500)

    return () => clearInterval(interval)
  }, [previewMode, recordedCount, setPreviewMode, toast])

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

    if (extensionInstalled) {
      // Extension opens the real site and injects the picker
      window.postMessage({ type: 'TRAILGUIDE_EXT_START_RECORDING', url: previewUrl }, '*')
    } else {
      // Fallback: open proxied site in a new window
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(previewUrl)}`
      const win = window.open(proxyUrl, 'trailguide-recorder', 'width=1280,height=800')
      if (win) {
        recordWindowRef.current = win
      } else {
        toast.error('Popup blocked. Please allow popups for this site.')
        setPreviewMode('edit')
      }
    }
  }

  const handleStopRecording = () => {
    if (extensionInstalled) {
      // Tell the extension to stop and close the recording tab
      window.postMessage({ type: 'TRAILGUIDE_EXT_STOP_RECORDING' }, '*')
    } else if (recordWindowRef.current && !recordWindowRef.current.closed) {
      recordWindowRef.current.postMessage({ type: 'TRAILGUIDE_STOP_RECORDING' }, window.location.origin)
      recordWindowRef.current.close()
    }
    recordWindowRef.current = null
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
              : previewMode === 'play'
                ? 'bg-violet-50 text-violet-800 border-b border-violet-200'
                : 'bg-muted border-b border-border'
          }`}
        >
          {previewMode === 'record' ? (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-medium">Recording{extensionInstalled ? '' : ' (proxy)'}</span>
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
                <Button size="sm" variant="default" onClick={handleStartRecording}>
                  <Video className="h-3 w-3 mr-1" />
                  Start Recording
                </Button>
                {isLoaded && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartPlayback}
                    disabled={totalSteps === 0}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Preview Trail
                  </Button>
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
                Enter your app URL above, then click &ldquo;Start Recording&rdquo; to open your site
                and capture a flow.
              </p>
              <div className="bg-muted p-4 rounded-lg text-left">
                <p className="text-sm font-medium mb-2">How it works:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Enter your app URL and click Load</li>
                  <li>Click &ldquo;Start Recording&rdquo; to open your site in a new window</li>
                  <li>Click elements in the window to capture tour steps</li>
                  <li>Close the window or click Stop to finish</li>
                  <li>Edit step content and reorder in the sidebar</li>
                </ol>
              </div>
              {!extensionInstalled && (
                <p className="text-xs text-muted-foreground mt-4">
                  Install the <strong>Trailguide Recorder</strong> extension for the best experience
                  — record on the real site with full fidelity.
                </p>
              )}
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <h3 className="font-medium mb-2">Failed to load preview</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Site in New Tab
            </Button>
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
              sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </>
        )}
      </div>
    </div>
  )
}
