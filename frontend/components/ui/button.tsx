// ABOUTME: Button component for interactive actions
// ABOUTME: Supports variants (default, outline) and sizes (sm, md, lg)

import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline"
  size?: "sm" | "md" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", ...props }, ref) => {
    const baseStyles = "font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center gap-2"

    const variantStyles = {
      default: "bg-primary text-white hover:bg-opacity-90 active:bg-opacity-80",
      outline: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
    }

    const sizeStyles = {
      sm: "px-2 py-1 text-xs",
      md: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base"
    }

    return (
      <button
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
