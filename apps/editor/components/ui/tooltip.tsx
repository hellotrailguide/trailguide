'use client'

import { useState, useRef } from 'react'
import {
  useFloating,
  useHover,
  useInteractions,
  offset,
  flip,
  shift,
  arrow,
  FloatingArrow,
  FloatingPortal,
  type Placement,
} from '@floating-ui/react'

interface TooltipProps {
  content: string
  placement?: Placement
  children: React.ReactElement
}

export function Tooltip({ content, placement = 'right', children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const arrowRef = useRef(null)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    middleware: [offset(8), flip(), shift({ padding: 8 }), arrow({ element: arrowRef })],
  })

  const hover = useHover(context, { delay: { open: 400, close: 0 } })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover])

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </div>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md"
          >
            {content}
            <FloatingArrow ref={arrowRef} context={context} className="fill-foreground" width={10} height={5} />
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
