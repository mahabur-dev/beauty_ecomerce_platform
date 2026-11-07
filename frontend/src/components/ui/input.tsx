import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string | undefined;
  error?: string | undefined;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, containerClassName, error, hint, id, label, required, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div className={cn("w-full", containerClassName)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="text-ink mb-2 block text-sm font-semibold"
        >
          {label}
          {required ? (
            <span className="text-brand-600 ml-1" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(
          "border-line bg-surface-elevated text-ink placeholder:text-ink-muted/70 focus:border-brand-500 focus:ring-brand-100 h-11 w-full rounded-xl border px-3.5 text-sm transition outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
          error && "border-red-500 focus:border-red-500 focus:ring-red-100",
          className,
        )}
        {...props}
      />
      {error || hint ? (
        <p
          id={messageId}
          className={cn(
            "mt-2 text-sm",
            error ? "text-red-600" : "text-ink-muted",
          )}
        >
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
});
