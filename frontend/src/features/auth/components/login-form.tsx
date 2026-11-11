"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Button, Input } from "@/components/ui";

import { login } from "../api";
import { authErrorMessage, authFieldErrors } from "../errors";
import { currentUserQueryKey, useCurrentUser } from "../hooks";
import { loginSchema, zodFieldErrors, type AuthFieldErrors } from "../schemas";
import { resolveReferrerReturnPath, safeReturnPath } from "../utils";
import { FormAlert } from "./form-alert";
import { PasswordInput } from "./password-input";

export function LoginForm({ nextPath }: { nextPath?: string | undefined }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const queryNext = searchParams.get("next") ?? undefined;
  const rawNext = nextPath ?? queryNext;

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
      const referrerPath =
        typeof window !== "undefined"
          ? resolveReferrerReturnPath(document.referrer, window.location.origin)
          : undefined;
      router.replace(safeReturnPath(rawNext ?? referrerPath));
      router.refresh();
    },
    onError: (error) => {
      setErrors(authFieldErrors(error));
      setFormError(authErrorMessage(error));
    },
  });

  useEffect(() => {
    if (!mutation.isSuccess && currentUserQuery.data) {
      const referrerPath = resolveReferrerReturnPath(
        document.referrer,
        window.location.origin,
      );
      router.replace(safeReturnPath(rawNext ?? referrerPath));
    }
  }, [currentUserQuery.data, mutation.isSuccess, rawNext, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(undefined);

    const formData = new FormData(event.currentTarget);
    const result = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      remember: formData.get("remember") === "on",
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
      <div>
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          error={errors.password}
          disabled={mutation.isPending}
          required
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <label className="text-ink-muted flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="remember"
              className="accent-brand-600 size-4 rounded"
              disabled={mutation.isPending}
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-brand-700 hover:text-brand-800 text-sm font-semibold underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        isLoading={mutation.isPending}
      >
        Sign in securely
      </Button>
    </form>
  );
}
