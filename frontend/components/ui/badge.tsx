// ABOUTME: Badge component for status indicators and labels
// ABOUTME: Supports multiple variants (default, purple, success, warning, error)

import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "purple" | "success" | "warning" | "error"
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium transition-colors"

    const variantStyles = {
      default: "bg-neutral-100 text-neutral-700",
      purple: "bg-purple-100 text-purple-700",
      success: "bg-success-50 text-success-600",
      warning: "bg-warning-50 text-warning-600",
      error: "bg-error-50 text-error-600"
    }

    return (
      <span
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
