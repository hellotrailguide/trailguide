'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ExternalLink,
  Video,
  Square,
  ImageOff,
  MousePointer,
  PuzzleIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEditorStore } from '@/lib/stores/editor-store'
import type { SelectorQuality, EditorStep } from '@/lib/stores/editor-store'
import { toast } from '@/components/ui/toast'

export function PreviewPane() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [urlInput, setUrlInput] = useState('')
  const [recordedCount, setRecordedCount] = useState(0)
  const [pendingStep, setPendingStep] = useState<{
    selector: string
    quality: SelectorQuality
    qualityHint: string
    screenshot?: string
    elementRect?: { x: number; y: number; width: number; height: number }
    viewportSize?: { width: number; height: number }
  } | null>(null)
  const [extensionInstalled, setExtensionInstalled] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

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

  // Ping for extension on mount
  useEffect(() => {
    window.postMessage({ type: 'TRAILGUIDE_EXT_PING' }, '*')
  }, [])

  // Track container size for responsive screenshot scaling
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Handle messages from extension bridge
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data?.type) return
      if (event.origin !== window.location.origin && event.origin !== 'null') return

      switch (event.data.type) {
        case 'TRAILGUIDE_EXT_INSTALLED':
          setExtensionInstalled(true)
          break

        case 'TRAILGUIDE_SELECTOR': {
          const { selector, quality, qualityHint, screenshot, elementRect, viewportSize } = event.data
          if (!selector) return
          setPendingStep({ selector, quality, qualityHint, screenshot, elementRect, viewportSize })
          break
        }

        case 'TRAILGUIDE_RECORDER_STOPPED':
          setPreviewMode('edit')
          const stoppedCount = recordedCount
          setRecordedCount(0)
          if (stoppedCount > 0) {
            toast.success(`${stoppedCount} step${stoppedCount === 1 ? '' : 's'} captured`)
          }
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [setPreviewMode, recordedCount])

  // Process received selectors — add steps during recording
  useEffect(() => {
    if (!pendingStep) return

    const { selector, quality, qualityHint, screenshot, elementRect, viewportSize } = pendingStep

    if (!useEditorStore.getState().trail) {
      createNewTrail()
    }

    addStep({
      title: 'Step ' + ((useEditorStore.getState().trail?.steps.length ?? 0) + 1),
      content: 'Describe this step...',
      target: selector,
      placement: 'bottom',
    })

    const trailNow = useEditorStore.getState().trail
    if (trailNow) {
      const newIdx = trailNow.steps.length - 1
      updateStep(newIdx, {
        selectorQuality: quality as SelectorQuality,
        selectorQualityHint: qualityHint || '',
        screenshot: screenshot || undefined,
        elementRect: elementRect || undefined,
        viewportSize: viewportSize || undefined,
      })
    }
    setRecordedCount((c) => c + 1)

    toast.success(`Element selected: ${selector.slice(0, 35)}${selector.length > 35 ? '...' : ''}`)
    setPendingStep(null)
  }, [pendingStep, updateStep, addStep, createNewTrail])

  const handleLoadUrl = () => {
    if (!urlInput) return
    let url = urlInput
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    setPreviewUrl(url)
  }

  const handleStartRecording = () => {
    if (!previewUrl) {
      toast.error('Enter a URL first')
      return
    }
    if (!trail) createNewTrail()
    setRecordedCount(0)
    setPreviewMode('record')
    window.postMessage({ type: 'TRAILGUIDE_EXT_START_RECORDING', url: previewUrl }, '*')
  }

  const handleStopRecording = () => {
    window.postMessage({ type: 'TRAILGUIDE_EXT_STOP_RECORDING' }, '*')
    setPreviewMode('edit')
    const count = recordedCount
    setRecordedCount(0)
    if (count > 0) {
      toast.success(`${count} step${count === 1 ? '' : 's'} captured`)
    }
  }

  const totalSteps = trail?.steps.length ?? 0
  const selectedStep: EditorStep | null =
    trail && selectedStepIndex !== null ? trail.steps[selectedStepIndex] ?? null : null

  const computeScale = useCallback(() => {
    if (!selectedStep?.screenshot || !selectedStep.viewportSize) return null
    const { width: vw, height: vh } = selectedStep.viewportSize
    if (!containerSize.width || !containerSize.height) return null

    const scaleX = containerSize.width / vw
    const scaleY = containerSize.height / vh
    const scale = Math.min(scaleX, scaleY)

    return {
      scale,
      imgWidth: vw * scale,
      imgHeight: vh * scale,
      offsetX: (containerSize.width - vw * scale) / 2,
      offsetY: (containerSize.height - vh * scale) / 2,
    }
  }, [selectedStep, containerSize])

  const scaleInfo = computeScale()

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
      {previewUrl && extensionInstalled && (
        <div
          className={`flex items-center gap-2 px-4 py-2 text-sm ${
            previewMode === 'record'
              ? 'bg-destructive/10 text-destructive border-b border-destructive/20'
              : 'bg-muted border-b border-border'
          }`}
        >
          {previewMode === 'record' ? (
            <>
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
              <span className="font-medium">Recording</span>
              <span className="text-destructive">
                {recordedCount} step{recordedCount === 1 ? '' : 's'} captured
              </span>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto bg-background"
                onClick={handleStopRecording}
              >
                <Square className="h-3 w-3 mr-1" />
                Stop Recording
              </Button>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">
                {selectedStepIndex !== null
                  ? `Step ${selectedStepIndex + 1} of ${totalSteps}`
                  : `${totalSteps} step${totalSteps === 1 ? '' : 's'}`}
              </span>
              <Button size="sm" variant="default" className="ml-auto" onClick={handleStartRecording}>
                <Video className="h-3 w-3 mr-1" />
                Start Recording
              </Button>
            </>
          )}
        </div>
      )}

      {/* Preview content */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {!extensionInstalled ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="max-w-sm">
              <PuzzleIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-medium mb-2">Install the Trailguide Extension</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Recording requires the Trailguide Chrome extension. It opens your app in a new tab and lets you click elements to capture steps.
              </p>
              <Button
                onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
                className="w-full"
              >
                Install Chrome Extension
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Already installed? Try refreshing the page.
              </p>
            </div>
          </div>
        ) : !previewUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="max-w-md">
              <Video className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-medium mb-2">Create your product tour</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your app URL above, then click &ldquo;Start Recording&rdquo; to open your site and capture a flow.
              </p>
              <div className="bg-muted p-4 rounded-lg text-left">
                <p className="text-sm font-medium mb-2">How it works:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Enter your app URL and click Load</li>
                  <li>Click &ldquo;Start Recording&rdquo; — your site opens in a new tab</li>
                  <li>Click elements to capture tour steps</li>
                  <li>Hit Done or close the tab when finished</li>
                  <li>Edit step content and reorder in the sidebar</li>
                </ol>
              </div>
            </div>
          </div>
        ) : selectedStep === null ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <MousePointer className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Select a step to see its screenshot</p>
          </div>
        ) : !selectedStep.screenshot ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <ImageOff className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">No screenshot available</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Screenshots are captured automatically when recording. Re-record this step to capture one.
            </p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
            <img
              src={selectedStep.screenshot}
              alt={`Screenshot for ${selectedStep.title || 'step'}`}
              style={{
                width: scaleInfo?.imgWidth ?? '100%',
                height: scaleInfo?.imgHeight ?? 'auto',
                objectFit: 'contain',
              }}
              className="block"
              draggable={false}
            />
            {scaleInfo && selectedStep.elementRect && (
              <div
                style={{
                  position: 'absolute',
                  left: scaleInfo.offsetX + selectedStep.elementRect.x * scaleInfo.scale,
                  top: scaleInfo.offsetY + selectedStep.elementRect.y * scaleInfo.scale,
                  width: selectedStep.elementRect.width * scaleInfo.scale,
                  height: selectedStep.elementRect.height * scaleInfo.scale,
                  boxShadow: '0 0 0 4000px rgba(0,0,0,0.15)',
                  border: '2px solid #1a91a2',
                  borderRadius: 4,
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
