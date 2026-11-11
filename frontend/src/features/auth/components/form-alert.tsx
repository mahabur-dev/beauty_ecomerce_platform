import { DismissibleAlert } from "@/components/ui";

interface FormAlertProps {
  tone?: "error" | "success";
  durationMs?: number | undefined;
  dismissible?: boolean | undefined;
  onDismiss?: (() => void) | undefined;
  children: React.ReactNode;
}

export function FormAlert({
  tone = "error",
  durationMs,
  dismissible,
  onDismiss,
  children,
}: FormAlertProps) {
  return (
    <DismissibleAlert
      tone={tone}
      durationMs={durationMs}
      dismissible={dismissible}
      onDismiss={onDismiss}
    >
      {children}
    </DismissibleAlert>
  );
}
