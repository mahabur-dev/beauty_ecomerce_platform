"use client";

import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui";

import { resendVerificationEmail } from "../api";
import { authErrorMessage } from "../errors";
import { FormAlert } from "./form-alert";
import { SignOutButton } from "./sign-out-button";

export function AccountActions({ emailVerified }: { emailVerified: boolean }) {
  const [logoutError, setLogoutError] = useState<string>();
  const resendMutation = useMutation({ mutationFn: resendVerificationEmail });

  return (
    <div className="space-y-4">
      {resendMutation.isSuccess ? (
        <FormAlert tone="success" onDismiss={() => resendMutation.reset()}>
          {resendMutation.data.message}
        </FormAlert>
      ) : null}
      {resendMutation.isError ? (
        <FormAlert onDismiss={() => resendMutation.reset()}>
          {authErrorMessage(resendMutation.error)}
        </FormAlert>
      ) : null}
      {logoutError ? (
        <FormAlert onDismiss={() => setLogoutError(undefined)}>
          {logoutError}
        </FormAlert>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {!emailVerified ? (
          <Button
            variant="outline"
            leftIcon={<Mail className="size-4" aria-hidden="true" />}
            isLoading={resendMutation.isPending}
            onClick={() => resendMutation.mutate()}
          >
            Resend verification
          </Button>
        ) : null}
        <SignOutButton
          className="w-full sm:w-auto"
          onError={setLogoutError}
        />
      </div>
    </div>
  );
}
