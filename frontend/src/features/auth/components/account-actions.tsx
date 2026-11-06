"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui";

import { logout, resendVerificationEmail } from "../api";
import { authErrorMessage } from "../errors";
import { currentUserQueryKey } from "../hooks";
import { FormAlert } from "./form-alert";

export function AccountActions({ emailVerified }: { emailVerified: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(currentUserQueryKey, null);
      queryClient.removeQueries({ queryKey: currentUserQueryKey });
      router.replace("/login");
      router.refresh();
    },
  });
  const resendMutation = useMutation({ mutationFn: resendVerificationEmail });

  return (
    <div className="space-y-4">
      {resendMutation.isSuccess ? (
        <FormAlert tone="success">{resendMutation.data.message}</FormAlert>
      ) : null}
      {resendMutation.isError ? (
        <FormAlert>{authErrorMessage(resendMutation.error)}</FormAlert>
      ) : null}
      {logoutMutation.isError ? (
        <FormAlert>{authErrorMessage(logoutMutation.error)}</FormAlert>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        {!emailVerified ? (
          <Button
            variant="outline"
            isLoading={resendMutation.isPending}
            onClick={() => resendMutation.mutate()}
          >
            <Mail className="size-4" aria-hidden="true" />
            Resend verification
          </Button>
        ) : null}
        <Button
          variant="ghost"
          isLoading={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
