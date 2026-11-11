"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui";

import { logout } from "../api";
import { authErrorMessage } from "../errors";
import { currentUserQueryKey } from "../hooks";
import { FormAlert } from "./form-alert";

export interface SignOutButtonProps
  extends Omit<ButtonProps, "children" | "onClick" | "isLoading" | "onError"> {
  label?: string;
  loadingLabel?: string;
  redirectTo?: Route;
  onError?: (message: string | undefined) => void;
}

export function SignOutButton({
  className,
  label = "Sign out",
  loadingLabel = "Signing out…",
  onError,
  redirectTo = "/login",
  size = "md",
  variant = "danger",
  ...props
}: SignOutButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [inlineError, setInlineError] = useState<string>();

  const mutation = useMutation({
    mutationFn: logout,
    onMutate: () => {
      setInlineError(undefined);
      onError?.(undefined);
    },
    onSuccess: () => {
      queryClient.setQueryData(currentUserQueryKey, null);
      queryClient.removeQueries({ queryKey: currentUserQueryKey });
      router.replace(redirectTo);
      router.refresh();
    },
    onError: (error) => {
      const message = authErrorMessage(error);
      if (onError) {
        onError(message);
      } else {
        setInlineError(message);
      }
    },
  });

  const button = (
    <Button
      variant={variant}
      size={size}
      className={className}
      leftIcon={<LogOut className="size-4" aria-hidden="true" />}
      isLoading={mutation.isPending}
      loadingText={loadingLabel}
      onClick={() => mutation.mutate()}
      {...props}
    >
      {label}
    </Button>
  );

  if (onError || !inlineError) {
    return button;
  }

  return (
    <div className="space-y-3">
      <FormAlert onDismiss={() => setInlineError(undefined)}>
        {inlineError}
      </FormAlert>
      {button}
    </div>
  );
}
