import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-38 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // M3 Filled Button — cor primária sólida, texto on-primary
        default:
          "bg-[var(--md-color-primary)] text-[var(--md-color-on-primary)] rounded-[var(--md-shape-full)] shadow-sm hover:shadow-md hover:brightness-110 active:shadow-sm active:brightness-95",
        // M3 Destructive — error container
        destructive:
          "bg-[var(--md-color-error)] text-[var(--md-color-on-error)] rounded-[var(--md-shape-full)] shadow-sm hover:brightness-110 active:brightness-95",
        // M3 Outlined Button — borda com outline, fundo transparente
        outline:
          "border border-[var(--md-color-outline)] bg-transparent text-[var(--md-color-primary)] rounded-[var(--md-shape-full)] hover:bg-[var(--md-color-primary)]/[0.08] active:bg-[var(--md-color-primary)]/[0.12]",
        // M3 Tonal Button — secondary container, high visibility sem destaque total
        secondary:
          "bg-[var(--md-color-secondary-container)] text-[var(--md-color-on-secondary-container)] rounded-[var(--md-shape-full)] hover:brightness-95 active:brightness-90",
        // M3 Text Button — sem fundo, só texto
        ghost:
          "bg-transparent text-[var(--md-color-primary)] rounded-[var(--md-shape-full)] hover:bg-[var(--md-color-primary)]/[0.08] active:bg-[var(--md-color-primary)]/[0.12]",
        // M3 Text Button neutro
        link: "text-[var(--md-color-primary)] underline-offset-4 hover:underline rounded-[var(--md-shape-full)]",
      },
      size: {
        default: "h-10 px-6 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
