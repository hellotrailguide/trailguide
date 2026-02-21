'use client'

import { useState } from 'react'
import {
  HelpCircle,
  Book,
  Video,
  MessageCircle,
  ExternalLink,
  Lightbulb,
  X,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HelpMenuProps {
  onStartTour: () => void
}

export function HelpMenu({ onStartTour }: HelpMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const helpItems = [
    {
      icon: Video,
      label: 'Quick Start Tour',
      description: 'Learn the basics in 2 minutes',
      action: () => {
        onStartTour()
        setIsOpen(false)
      },
    },
    {
      icon: Book,
      label: 'Documentation',
      description: 'Guides and API reference',
      href: 'https://docs.gettrailguide.com',
    },
    {
      icon: Lightbulb,
      label: 'Tips & Best Practices',
      description: 'Create better tours',
      href: 'https://docs.gettrailguide.com/guides/writing-tours',
    },
    {
      icon: MessageCircle,
      label: 'Get Help',
      description: 'Email us at support@trailguide.com',
      href: 'mailto:support@trailguide.com',
    },
  ]

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 rounded-lg"
        title="Help"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute left-full bottom-0 ml-2 z-50 w-72 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-medium">Help & Resources</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-2">
              {helpItems.map((item, index) => {
                const Icon = item.icon
                const content = (
                  <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted transition-colors cursor-pointer">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{item.label}</span>
                        {item.href && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                )

                if (item.href) {
                  return (
                    <a
                      key={index}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {content}
                    </a>
                  )
                }

                return (
                  <div key={index} onClick={item.action}>
                    {content}
                  </div>
                )
              })}
            </div>

            <div className="p-3 border-t border-border bg-muted/50">
              <p className="text-xs text-muted-foreground text-center">
                Press <kbd className="px-1.5 py-0.5 bg-background rounded text-xs">?</kbd> anytime for help
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
