// ABOUTME: Keyboard key display component
// ABOUTME: Shows keyboard shortcuts in a styled format

import * as React from "react"

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className = "", ...props }, ref) => (
    <kbd
      ref={ref}
      className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold text-gray-900 bg-gray-100 border border-gray-200 rounded ${className}`}
      {...props}
    />
  )
)
Kbd.displayName = "Kbd"

export { Kbd }
