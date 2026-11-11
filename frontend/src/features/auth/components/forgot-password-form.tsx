"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button, Input } from "@/components/ui";

import { requestPasswordReset } from "../api";
import { authErrorMessage, authFieldErrors } from "../errors";
import {
  forgotPasswordSchema,
  zodFieldErrors,
  type AuthFieldErrors,
} from "../schemas";
import { FormAlert } from "./form-alert";

export function ForgotPasswordForm() {
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const mutation = useMutation({
    mutationFn: requestPasswordReset,
    onError: (error) => {
      setErrors(authFieldErrors(error));
      setFormError(authErrorMessage(error));
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(undefined);
    const formData = new FormData(event.currentTarget);
    const result = forgotPasswordSchema.safeParse({
      email: formData.get("email"),
    });

    if (!result.success) {
      setErrors(zodFieldErrors(result.error));
      return;
    }

    mutation.mutate(result.data.email);
  }

  if (mutation.isSuccess) {
    return (
      <div className="space-y-6">
        <FormAlert tone="success" durationMs={0} dismissible={false}>
          {mutation.data.message}
        </FormAlert>
        <p className="text-ink-muted text-sm leading-6">
          For your security, the message is the same whether or not an account
          exists. Check your inbox and spam folder.
        </p>
        <Link
          href="/login"
          className="text-brand-700 hover:text-brand-800 inline-flex text-sm font-semibold underline-offset-4 hover:underline"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <FormAlert onDismiss={() => setFormError(undefined)}>
          {formError}
        </FormAlert>
      ) : null}
      <Input
        label="Email address"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email}
        disabled={mutation.isPending}
        required
      />
      <Button
        type="submit"
        size="lg"
        className="w-full"
        isLoading={mutation.isPending}
      >
        Send reset link
      </Button>
    </form>
  );
}
