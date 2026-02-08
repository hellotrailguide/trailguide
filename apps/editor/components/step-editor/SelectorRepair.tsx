'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Check, RefreshCw, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SelectorSuggestion {
  selector: string
  confidence: number
  reason: string
}

interface SelectorRepairProps {
  selector: string
  isBroken: boolean
  suggestions: SelectorSuggestion[]
  onRepair: (newSelector: string) => void
  onRefresh: () => void
}

export function SelectorRepair({
  selector,
  isBroken,
  suggestions,
  onRepair,
  onRefresh,
}: SelectorRepairProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isBroken) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600">
        <Check className="h-3 w-3" />
        <span>Selector valid</span>
      </div>
    )
  }

  return (
    <div className="border border-destructive/50 rounded-md p-3 bg-destructive/5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Selector not found on page</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRefresh}>
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Wrench className="h-3 w-3 mr-1" />
            {suggestions.length > 0 ? `${suggestions.length} suggestions` : 'No suggestions'}
          </Button>
        </div>
      </div>

      {isExpanded && suggestions.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Click a suggestion to replace the broken selector:
          </p>
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onRepair(suggestion.selector)}
              className={cn(
                'w-full text-left p-2 rounded border bg-background hover:bg-muted transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <code className="text-xs font-mono break-all">{suggestion.selector}</code>
                <Badge
                  variant={suggestion.confidence > 0.7 ? 'default' : 'secondary'}
                  className="flex-shrink-0"
                >
                  {Math.round(suggestion.confidence * 100)}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
            </button>
          ))}
        </div>
      )}

      {isExpanded && suggestions.length === 0 && (
        <div className="mt-3 text-xs text-muted-foreground">
          <p>No similar elements found. Try:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Check if the element still exists on the page</li>
            <li>Use the visual picker to select a new element</li>
            <li>Add a data-trail-id attribute to the target element</li>
          </ul>
        </div>
      )}
    </div>
  )
}
