"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui";

import { resendVerificationEmail, verifyEmail } from "../api";
import { authErrorMessage } from "../errors";
import { currentUserQueryKey, useCurrentUser } from "../hooks";
import { buildAuthHrefWithNext, safeReturnPath } from "../utils";
import { FormAlert } from "./form-alert";

interface VerificationParams {
  id: string;
  hash: string;
  expires: string;
  signature: string;
}

export function VerifyEmailPanel({
  verification,
  nextPath,
}: {
  verification?: VerificationParams | undefined;
  nextPath?: string | undefined;
}) {
  const queryClient = useQueryClient();
  const started = useRef(false);
  const userQuery = useCurrentUser();
  const continueHref = safeReturnPath(nextPath);
  const loginReturnHref = buildAuthHrefWithNext(
    "/login",
    buildAuthHrefWithNext("/verify-email", nextPath),
  );
  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    },
  });
  const resendMutation = useMutation({
    mutationFn: resendVerificationEmail,
  });

  useEffect(() => {
    if (verification && !started.current) {
      started.current = true;
      verifyMutation.mutate(verification);
    }
  }, [verification, verifyMutation]);

  if (verifyMutation.isPending) {
    return (
      <div className="text-ink-muted py-4 text-center text-sm" role="status">
        Verifying your email address…
      </div>
    );
  }

  if (verifyMutation.isSuccess || userQuery.data?.email_verified) {
    return (
      <div className="space-y-6 text-center">
        <span className="bg-brand-100 text-brand-700 mx-auto grid size-16 place-items-center rounded-full">
          <MailCheck className="size-8" aria-hidden="true" />
        </span>
        <FormAlert tone="success" durationMs={0} dismissible={false}>
          Your email address is verified. Your account is ready.
        </FormAlert>
        <Link
          href={continueHref}
          className="bg-brand-600 hover:bg-brand-700 inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white transition-colors"
        >
          {continueHref === "/account" ? "Continue to my account" : "Continue"}
        </Link>
      </div>
    );
  }

  if (!userQuery.isPending && !userQuery.data) {
    return (
      <div className="space-y-5">
        <FormAlert durationMs={0} dismissible={false}>
          You need to sign in before verifying your email.
        </FormAlert>
        <Link
          href={loginReturnHref}
          className="text-brand-700 text-sm font-semibold underline-offset-4 hover:underline"
        >
          Sign in to continue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {verifyMutation.isError ? (
        <FormAlert>{authErrorMessage(verifyMutation.error)}</FormAlert>
      ) : null}
      {resendMutation.isSuccess ? (
        <FormAlert tone="success">{resendMutation.data.message}</FormAlert>
      ) : null}
      {resendMutation.isError ? (
        <FormAlert>{authErrorMessage(resendMutation.error)}</FormAlert>
      ) : null}
      <div className="text-ink-muted space-y-2 text-sm leading-6">
        <p>
          We sent a verification link to{" "}
          <strong className="text-ink">{userQuery.data?.email}</strong>.
        </p>
        <p>Open the link in that email to activate your account.</p>
      </div>
      <Button
        variant="outline"
        className="w-full"
        isLoading={resendMutation.isPending}
        onClick={() => resendMutation.mutate()}
      >
        Resend verification email
      </Button>
      <Button
        variant="ghost"
        className="w-full"
        isLoading={userQuery.isFetching}
        onClick={() => void userQuery.refetch()}
      >
        I&apos;ve verified my email
      </Button>
    </div>
  );
}
