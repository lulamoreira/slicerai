import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-[#0d0d14] font-bold rounded-xl px-6 py-3 hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all hover:shadow-[var(--primary-glow)] disabled:opacity-40",
        destructive: "bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 rounded-xl px-6 py-3",
        outline:
          "border border-border-strong bg-transparent text-foreground hover:bg-surface-hover hover:border-primary hover:text-primary rounded-xl px-6 py-3",
        secondary: "bg-surface-raised text-foreground border border-border shadow-sm hover:bg-surface-hover rounded-xl px-6 py-3",
        ghost: "bg-transparent text-muted hover:text-primary hover:bg-primary-subtle rounded-xl px-6 py-3",
        link: "text-primary underline-offset-4 hover:underline",

      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
