// ABOUTME: Keyboard key display component
// ABOUTME: Shows keyboard shortcuts in a styled format

import * as React from "react"

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className = "", ...props }, ref) => (
    <kbd
      ref={ref}
      className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium text-white/90 bg-transparent rounded ${className}`}
      {...props}
    />
  )
)
Kbd.displayName = "Kbd"

export { Kbd }
