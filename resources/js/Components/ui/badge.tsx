import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // M3 Assist Chip base
  "inline-flex items-center gap-1 rounded-[var(--md-shape-sm)] px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--md-color-primary)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        // M3 Suggestion Chip — surface-variant
        default:
          "border border-[var(--md-color-outline-variant)] bg-[var(--md-color-surface-container-high)] text-[var(--md-color-on-surface)]",
        // M3 Filter Chip selecionado — secondary container
        secondary:
          "bg-[var(--md-color-secondary-container)] text-[var(--md-color-on-secondary-container)] border-transparent",
        // M3 Error Chip
        destructive:
          "bg-[var(--md-color-error-container)] text-[var(--md-color-on-error-container)] border-transparent",
        // Outline
        outline:
          "border border-[var(--md-color-outline)] bg-transparent text-[var(--md-color-on-surface)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
