import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium font-mono text-xs rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan focus-visible:ring-offset-1 focus-visible:ring-offset-navy-void disabled:opacity-40 disabled:pointer-events-none cursor-pointer active:scale-[0.98]";

    const variantStyles = {
      // Primary: Luminous Electric-to-Cyan gradient with high contrast dark text
      primary:
        "bg-gradient-to-r from-electric via-cyan to-teal text-[#030810] font-bold shadow-glow-cyan/40 hover:shadow-glow-cyan border border-cyan/50 hover:brightness-110",
      // Secondary: Deep navy surface with subtle technical cyan border
      secondary:
        "bg-navy-elevated/90 hover:bg-navy-subtle text-text-primary border border-cyan/20 hover:border-cyan/50 shadow-sm",
      // Outline: Technical transparent border
      outline:
        "bg-transparent hover:bg-navy-elevated/60 text-text-secondary hover:text-white border border-border hover:border-cyan/40",
      // Ghost: Subdued with clean hover state
      ghost:
        "bg-transparent hover:bg-navy-elevated/50 text-text-muted hover:text-text-primary",
      // Danger: Deep crimson border
      danger:
        "bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 hover:border-rose-700",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-xs gap-2",
      lg: "h-11 px-6 text-sm gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
