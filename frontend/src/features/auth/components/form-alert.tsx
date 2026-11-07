import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface FormAlertProps {
  tone?: "error" | "success";
  children: React.ReactNode;
}

export function FormAlert({ tone = "error", children }: FormAlertProps) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-5",
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
