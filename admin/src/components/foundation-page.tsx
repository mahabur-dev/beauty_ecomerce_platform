import Link from "next/link";
import type { Permission } from "@/features/auth/permissions";
import { PermissionGate } from "@/features/auth/components/permission-gate";

export function FoundationPage({
  title,
  permission,
}: {
  title: string;
  permission?: Permission;
}) {
  const content = (
    <section aria-labelledby="page-heading">
      <h1 id="page-heading" className="text-2xl font-semibold">
        {title}
      </h1>
      <p className="mt-3">
        This module is reserved for the approved feature implementation. No
        business data has been modified.
      </p>
      <p className="mt-4">
        <Link href="/dashboard" className="underline">
          Back to overview
        </Link>
      </p>
    </section>
  );
  return permission ? (
    <PermissionGate permission={permission}>{content}</PermissionGate>
  ) : (
    content
  );
}
