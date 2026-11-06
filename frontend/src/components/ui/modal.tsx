"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  position?: "center" | "right";
  closeLabel?: string;
}

const modalSizes = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
} as const;

export function Modal({
  children,
  closeLabel = "Close dialog",
  description,
  footer,
  onOpenChange,
  open,
  position = "center",
  size = "md",
  title,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
      className={cn(
        "m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/45 backdrop:backdrop-blur-[2px]",
        position === "center" && "place-items-center open:grid",
        position === "right" && "ml-auto open:flex open:justify-end",
      )}
    >
      <section
        className={cn(
          "bg-surface-elevated text-ink flex w-full flex-col shadow-2xl",
          position === "center" && [
            "max-h-[min(48rem,calc(100dvh-2rem))] rounded-2xl",
            modalSizes[size],
          ],
          position === "right" && "h-dvh max-w-sm",
        )}
      >
        <header className="border-line flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-lg font-bold tracking-tight">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-ink-muted mt-1 text-sm">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="-mt-2 -mr-2"
            aria-label={closeLabel}
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {children}
        </div>
        {footer ? (
          <footer className="border-line flex flex-wrap justify-end gap-3 border-t px-5 py-4 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </section>
    </dialog>
  );
}
