import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "accent" | "hud";
  children: React.ReactNode;
}

export function Card({ className, variant = "default", children, ...props }: CardProps) {
  const variantStyles = {
    default: "border-border/70 bg-navy-deep/80 hover:border-cyan/30 backdrop-blur-md",
    elevated: "border-cyan/20 bg-navy-elevated/85 shadow-hud-card hover:border-cyan/40 backdrop-blur-lg",
    accent: "border-cyan/40 bg-navy-elevated/90 shadow-glow-cyan/20 backdrop-blur-lg",
    hud: "hud-border bg-navy-deep/85 backdrop-blur-md shadow-hud-card",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-5 text-text-primary transition-all duration-200",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1 pb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-semibold tracking-wide text-text-primary font-mono", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-text-secondary mt-0.5 leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center pt-3 border-t border-border/50 mt-3", className)} {...props}>
      {children}
    </div>
  );
}
