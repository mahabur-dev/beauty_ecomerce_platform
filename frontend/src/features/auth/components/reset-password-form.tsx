"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button, Input } from "@/components/ui";

import { resetPassword } from "../api";
import { authErrorMessage, authFieldErrors } from "../errors";
import {
  resetPasswordSchema,
  zodFieldErrors,
  type AuthFieldErrors,
} from "../schemas";
import { FormAlert } from "./form-alert";
import { PasswordInput } from "./password-input";

interface ResetPasswordFormProps {
  email?: string | undefined;
  token?: string | undefined;
}

export function ResetPasswordForm({
  email = "",
  token = "",
}: ResetPasswordFormProps) {
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const mutation = useMutation({
    mutationFn: resetPassword,
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
    const result = resetPasswordSchema.safeParse({
      email: formData.get("email"),
      token,
      password: formData.get("password"),
      password_confirmation: formData.get("password_confirmation"),
    });

    if (!result.success) {
      setErrors(zodFieldErrors(result.error));
      return;
    }

    mutation.mutate(result.data);
  }

  if (!token) {
    return (
      <div className="space-y-5">
        <FormAlert>This password reset link is incomplete.</FormAlert>
        <Link
          href="/forgot-password"
          className="text-brand-700 text-sm font-semibold underline-offset-4 hover:underline"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="space-y-6">
        <FormAlert tone="success">{mutation.data.message}</FormAlert>
        <Link
          href="/login"
          className="text-brand-700 text-sm font-semibold underline-offset-4 hover:underline"
        >
          Sign in with your new password
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {formError ? <FormAlert>{formError}</FormAlert> : null}
      <Input
        label="Email address"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        defaultValue={email}
        error={errors.email}
        disabled={mutation.isPending}
        required
      />
      <PasswordInput
        label="New password"
        name="password"
        autoComplete="new-password"
        error={errors.password}
        hint="At least 12 characters with upper/lowercase, a number and a symbol."
        disabled={mutation.isPending}
        required
      />
      <PasswordInput
        label="Confirm new password"
        name="password_confirmation"
        autoComplete="new-password"
        error={errors.password_confirmation}
        disabled={mutation.isPending}
        required
      />
      <Button
        type="submit"
        size="lg"
        className="w-full"
        isLoading={mutation.isPending}
      >
        Set new password
      </Button>
    </form>
  );
}
