"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button, Input } from "@/components/ui";

import { register } from "../api";
import { authErrorMessage, authFieldErrors } from "../errors";
import { currentUserQueryKey } from "../hooks";
import {
  registerSchema,
  zodFieldErrors,
  type AuthFieldErrors,
} from "../schemas";
import { buildAuthHrefWithNext } from "../utils";
import { FormAlert } from "./form-alert";
import { PasswordInput } from "./password-input";

export function RegisterForm({ nextPath }: { nextPath?: string | undefined }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const rawNext = nextPath ?? searchParams.get("next") ?? undefined;
  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
      router.replace(buildAuthHrefWithNext("/verify-email", rawNext));
      router.refresh();
    },
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
    const result = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      password_confirmation: formData.get("password_confirmation"),
    });

    if (!result.success) {
      setErrors(zodFieldErrors(result.error));
      return;
    }

    mutation.mutate(result.data);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <FormAlert onDismiss={() => setFormError(undefined)}>
          {formError}
        </FormAlert>
      ) : null}
      <Input
        label="Full name"
        name="name"
        autoComplete="name"
        placeholder="Your full name"
        error={errors.name}
        disabled={mutation.isPending}
        required
      />
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
      <PasswordInput
        label="Password"
        name="password"
        autoComplete="new-password"
        error={errors.password}
        hint="At least 12 characters with upper/lowercase, a number and a symbol."
        disabled={mutation.isPending}
        required
      />
      <PasswordInput
        label="Confirm password"
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
        Create my account
      </Button>
      <p className="text-ink-muted text-center text-xs leading-5">
        By creating an account, you agree to GlowCare&apos;s terms and privacy
        policy.
      </p>
    </form>
  );
}
