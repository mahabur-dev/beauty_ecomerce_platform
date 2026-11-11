import { LoaderCircle } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

const buttonVariants = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 focus-visible:outline-brand-600",
  secondary:
    "bg-brand-50 text-brand-800 hover:bg-brand-100 focus-visible:outline-brand-600",
  outline:
    "border-line bg-surface-elevated text-ink border hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-brand-600",
  ghost:
    "text-ink-muted hover:bg-brand-50 hover:text-ink focus-visible:outline-brand-600",
  danger:
    "border border-danger-700/15 bg-danger-600 text-white shadow-sm shadow-danger-600/25 hover:bg-danger-700 hover:shadow-md hover:shadow-danger-700/25 active:bg-danger-800 focus-visible:outline-danger-600",
  "danger-outline":
    "border border-danger-200 bg-danger-50/80 text-danger-700 shadow-xs hover:border-danger-300 hover:bg-danger-100 hover:text-danger-800 focus-visible:outline-danger-600",
} as const;

const buttonSizes = {
  sm: "h-9 gap-1.5 rounded-lg px-3 text-sm",
  md: "h-11 gap-2 rounded-xl px-5 text-sm",
  lg: "h-12 gap-2.5 rounded-xl px-6 text-base",
  icon: "size-11 rounded-xl",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string | undefined;
} = {}): string {
  return cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center font-semibold transition-all duration-150 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      children,
      disabled,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      size = "md",
      type = "button",
      variant = "primary",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonStyles({ variant, size, className })}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        {isLoading && loadingText ? loadingText : children}
        {!isLoading ? rightIcon : null}
      </button>
    );
  },
);
