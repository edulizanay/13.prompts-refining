// ABOUTME: Button component implementing design-context.yaml specifications
// ABOUTME: Supports primary, secondary, ghost, destructive variants with all states

import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive"
  size?: "small" | "medium" | "large"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "medium", ...props }, ref) => {
    const baseStyles = "font-medium rounded-md transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"

    const variantStyles = {
      primary: "bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700",
      secondary: "bg-transparent text-purple-500 hover:bg-purple-50 active:bg-purple-100",
      outline: "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100",
      ghost: "bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-700 active:bg-neutral-200",
      destructive: "bg-error-600 text-white hover:bg-error-700 active:bg-error-800 focus:ring-error-600"
    }

    const sizeStyles = {
      small: "px-3 py-1.5 text-xs h-7",
      medium: "px-4 py-2 text-sm h-9",
      large: "px-5 py-3 text-base h-11"
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
