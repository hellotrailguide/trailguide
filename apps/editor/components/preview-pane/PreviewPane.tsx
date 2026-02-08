'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ExternalLink, RefreshCw, AlertCircle, MousePointer2, Chrome, Video, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEditorStore } from '@/lib/stores/editor-store'
import { toast } from '@/components/ui/toast'

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage?: (extensionId: string, message: object, callback?: (response: any) => void) => void
      }
    }
  }
}

// Extension ID - update this after publishing to Chrome Web Store
const EXTENSION_ID = '' // Leave empty for development (uses externally_connectable)

export function PreviewPane() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [iframeReady, setIframeReady] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')

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

  // Send message to iframe (for extension content script)
  const postToIframe = useCallback((message: object) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, '*')
    }
  }, [])

  // Handle messages from iframe content script
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data?.type) return

      switch (event.data.type) {
        case 'TRAILGUIDE_IFRAME_READY':
          // Extension content script is ready in the iframe
          setIframeReady(true)
          console.log('[PreviewPane] Iframe picker ready')
          // Confirm to the iframe that we're the editor
          postToIframe({ type: 'TRAILGUIDE_EDITOR_CONFIRM' })
          break

        case 'TRAILGUIDE_SELECTOR':
          // Received a selector from the iframe picker
          const { selector } = event.data
          if (!selector) return

          console.log('[PreviewPane] Received selector:', selector)

          // Get current state
          const currentTrail = useEditorStore.getState().trail
          const currentSelectedStep = useEditorStore.getState().selectedStepIndex

          // If no trail exists, create one first
          if (!currentTrail) {
            createNewTrail()
          }

          // If we have a selected step, update it
          if (currentSelectedStep !== null) {
            updateStep(currentSelectedStep, { target: selector })
          } else {
            // No step selected - check if we have steps
            const trailAfterCreate = useEditorStore.getState().trail
            if (trailAfterCreate && trailAfterCreate.steps.length > 0) {
              const lastIndex = trailAfterCreate.steps.length - 1
              selectStep(lastIndex)
              updateStep(lastIndex, { target: selector })
            } else {
              // No steps exist - create a new step
              addStep({
                title: 'New Step',
                content: 'Describe this step...',
                target: selector,
                placement: 'bottom',
              })
            }
          }

          setPreviewMode('edit')
          toast.success(`Element selected: ${selector.slice(0, 35)}${selector.length > 35 ? '...' : ''}`)
          break

        case 'TRAILGUIDE_PICKER_STOPPED':
          setPreviewMode('edit')
          break

        case 'TRAILGUIDE_RECORDER_ENDED':
          setIsRecording(false)
          toast.info('Recording session ended')
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [postToIframe, updateStep, setPreviewMode, addStep, selectStep, createNewTrail])

  // Start recording in a new window (like QA tools)
  const startRecording = async () => {
    if (!previewUrl) {
      toast.error('Enter a URL first')
      return
    }

    try {
      // Try to communicate with extension via postMessage to background
      // The extension needs to open a new window with the recorder
      const message = {
        action: 'startRecorderSession',
        url: previewUrl,
        editorTabId: 'current' // Background will figure out current tab
      }

      // Send message to extension background script
      // This requires the extension to have externally_connectable or we use a different method

      // For now, store in localStorage and open window - extension will pick it up
      localStorage.setItem('trailguide_recorder_request', JSON.stringify({
        url: previewUrl,
        timestamp: Date.now()
      }))

      // Open the URL in a new window
      const newWindow = window.open(previewUrl, '_blank', 'width=1200,height=800')

      if (newWindow) {
        setIsRecording(true)
        toast.success('Recording window opened! Click elements to capture them.')
      } else {
        toast.error('Popup blocked. Please allow popups for this site.')
      }
    } catch (e) {
      console.error('Failed to start recording:', e)
      toast.error('Failed to start recording')
    }
  }

  // Send picker commands to iframe when mode changes
  useEffect(() => {
    if (!iframeReady) return

    if (previewMode === 'pick') {
      postToIframe({ type: 'TRAILGUIDE_START_PICKER' })
    } else {
      postToIframe({ type: 'TRAILGUIDE_STOP_PICKER' })
    }

    // Handle highlighting
    if (previewMode === 'edit' && trail && selectedStepIndex !== null) {
      const step = trail.steps[selectedStepIndex]
      if (step?.target) {
        postToIframe({ type: 'TRAILGUIDE_HIGHLIGHT', selector: step.target })
      } else {
        postToIframe({ type: 'TRAILGUIDE_CLEAR_HIGHLIGHT' })
      }
    }
  }, [iframeReady, previewMode, trail, selectedStepIndex, postToIframe])

  const handleLoadUrl = () => {
    if (!urlInput) return
    let url = urlInput
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    setPreviewUrl(url)
    setIsLoaded(false)
    setIframeReady(false)
    setError(null)
  }

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIframeReady(false)
      iframeRef.current.src = iframeRef.current.src
      setIsLoaded(false)
    }
  }

  const handleIframeLoad = () => {
    setIsLoaded(true)
    // The extension content script will send TRAILGUIDE_IFRAME_READY when ready
  }

  const handleIframeError = () => {
    setError('Failed to load preview. The site may not allow embedding.')
  }

  const handleStartPicking = () => {
    if (!iframeReady) {
      toast.error('Install the Trailguide Chrome extension to pick elements')
      return
    }
    setPreviewMode('pick')
  }

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

      {/* Recording / Extension status bar */}
      {previewUrl && (
        <div className={`flex items-center gap-2 px-4 py-2 text-sm ${
          isRecording
            ? 'bg-red-50 text-red-800 border-b border-red-200'
            : previewMode === 'pick'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted border-b border-border'
        }`}>
          {isRecording ? (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-medium">Recording in progress</span>
              <span className="text-red-600">Click elements in the popup window to capture them</span>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto bg-white"
                onClick={() => setIsRecording(false)}
              >
                <Square className="h-3 w-3 mr-1" />
                Stop
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
          ) : (
            <>
              <span className="text-muted-foreground">
                {isLoaded && iframeReady ? 'Preview loaded' : 'Preview'}
              </span>
              <div className="ml-auto flex gap-2">
                {isLoaded && iframeReady && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartPicking}
                  >
                    <MousePointer2 className="h-3 w-3 mr-1" />
                    Pick in Preview
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="default"
                  onClick={startRecording}
                >
                  <Video className="h-3 w-3 mr-1" />
                  Start Recording
                </Button>
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
                  <li>Click &ldquo;Start Recording&rdquo; to open your app</li>
                  <li>Navigate and click elements to capture them</li>
                  <li>Click &ldquo;Done&rdquo; when finished</li>
                </ol>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Requires the Trailguide Chrome extension.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <h3 className="font-medium mb-2">This site blocks embedding</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Most production sites block iframe embedding for security.
            </p>
            <div className="text-left bg-muted p-4 rounded-lg max-w-md">
              <p className="text-sm font-medium mb-2">Options:</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li><strong>1. Use localhost</strong> - Development servers typically allow embedding</li>
                <li><strong>2. For your own app</strong> - Add this header to allow the editor:
                  <code className="block bg-background p-2 mt-1 rounded text-xs">
                    Content-Security-Policy: frame-ancestors &apos;self&apos; {typeof window !== 'undefined' ? window.location.origin : 'https://editor.trailguide.dev'}
                  </code>
                </li>
                <li><strong>3. Open in new window</strong> - Use the extension to pick elements directly on the site
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
              src={previewUrl}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </>
        )}
      </div>
    </div>
  )
}
