import type { Metadata } from "next";
import { CheckCircle2, Mail, ShieldCheck, UserRound } from "lucide-react";

import { Badge, Card, CardContent, Container } from "@/components/ui";
import { AccountActions } from "@/features/auth";
import { requireServerUser } from "@/features/auth/server";

export const metadata: Metadata = {
  title: "My account",
  description: "Manage your GlowCare customer profile.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AccountPage() {
  const user = await requireServerUser();

  return (
    <section className="bg-surface-subtle py-10 sm:py-14 lg:py-16">
      <Container>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-brand-700 text-sm font-bold tracking-wider uppercase">
              Customer account
            </p>
            <h1 className="text-ink mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Welcome, {user.name}
            </h1>
            <p className="text-ink-muted mt-2">
              Your secure profile and account status at a glance.
            </p>
          </div>
          <Badge
            variant={user.email_verified ? "success" : "warning"}
            className="w-fit"
          >
            {user.email_verified ? "Email verified" : "Verification pending"}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <Card className="rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-7 flex items-center gap-4">
                <span className="bg-brand-100 text-brand-700 grid size-14 place-items-center rounded-full">
                  <UserRound className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-ink text-xl font-bold">
                    Profile details
                  </h2>
                  <p className="text-ink-muted text-sm">Customer information</p>
                </div>
              </div>
              <dl className="divide-line divide-y">
                <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
                  <dt className="text-ink-muted text-sm font-medium">
                    Full name
                  </dt>
                  <dd className="text-ink font-semibold">{user.name}</dd>
                </div>
                <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
                  <dt className="text-ink-muted text-sm font-medium">Email</dt>
                  <dd className="text-ink flex flex-wrap items-center gap-2 font-semibold">
                    {user.email}
                    {user.email_verified ? (
                      <CheckCircle2
                        className="size-4 text-emerald-600"
                        aria-label="Verified"
                      />
                    ) : null}
                  </dd>
                </div>
                <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
                  <dt className="text-ink-muted text-sm font-medium">
                    Account type
                  </dt>
                  <dd className="text-ink font-semibold">Customer</dd>
                </div>
              </dl>
              <div className="mt-7">
                <AccountActions emailVerified={user.email_verified} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="space-y-6 p-6">
              <div className="bg-brand-50 text-brand-700 grid size-11 place-items-center rounded-full">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-ink text-lg font-bold">Account security</h2>
                <p className="text-ink-muted mt-2 text-sm leading-6">
                  Your session is protected by a secure, HttpOnly cookie and
                  CSRF validation.
                </p>
              </div>
              {!user.email_verified ? (
                <div className="border-brand-200 bg-brand-50 flex gap-3 rounded-xl border p-4">
                  <Mail
                    className="text-brand-700 mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <p className="text-brand-900 text-sm leading-5">
                    Verify your email to finish securing your account.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  );
}
