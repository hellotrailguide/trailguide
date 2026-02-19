'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface TrialBannerProps {
  daysRemaining: number
}

export function TrialBanner({ daysRemaining }: TrialBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  const isUrgent = daysRemaining <= 3

  return (
    <div
      className={`flex items-center justify-between px-4 py-2 text-sm ${
        isUrgent
          ? 'bg-amber-50 text-amber-900 border-b border-amber-200'
          : 'bg-primary/5 text-primary border-b border-primary/10'
      }`}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        <span>
          {daysRemaining === 1 ? (
            <strong>Last day of your Pro trial!</strong>
          ) : daysRemaining <= 3 ? (
            <>
              <strong>{daysRemaining} days left</strong> in your Pro trial
            </>
          ) : (
            <>
              {daysRemaining} days left in your Pro trial
            </>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/dashboard/settings">
          <Button size="sm" variant={isUrgent ? 'default' : 'outline'}>
            Upgrade Now
          </Button>
        </Link>
        {!isUrgent && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
