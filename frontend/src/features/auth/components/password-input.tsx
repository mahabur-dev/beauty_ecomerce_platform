"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

interface PasswordInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

export function PasswordInput({
  className,
  error,
  hint,
  id,
  label,
  required,
  ...props
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const [visible, setVisible] = useState(false);

  return (
    <div className="w-full">
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
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(
            "border-line bg-surface-elevated text-ink placeholder:text-ink-muted/70 focus:border-brand-500 focus:ring-brand-100 h-11 w-full rounded-xl border pr-12 pl-3.5 text-sm transition outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
            error && "border-red-500 focus:border-red-500 focus:ring-red-100",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="text-ink-muted hover:text-brand-700 focus-visible:outline-brand-600 absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-lg focus-visible:outline-2"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeOff className="size-4.5" aria-hidden="true" />
          ) : (
            <Eye className="size-4.5" aria-hidden="true" />
          )}
        </button>
      </div>
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
}
