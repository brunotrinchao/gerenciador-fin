import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // M3 Outlined Text Field
          "flex h-14 w-full rounded-[var(--md-shape-xs)] border border-[var(--md-color-outline)]",
          "bg-transparent px-4 py-2 text-sm text-[var(--md-color-on-surface)]",
          "placeholder:text-[var(--md-color-on-surface-variant)]",
          "transition-colors duration-200",
          "hover:border-[var(--md-color-on-surface)]",
          "focus-visible:outline-none focus-visible:border-2 focus-visible:border-[var(--md-color-primary)]",
          "disabled:cursor-not-allowed disabled:opacity-38",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
