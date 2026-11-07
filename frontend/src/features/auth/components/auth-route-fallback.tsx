import { Card, CardContent, Skeleton } from "@/components/ui";

import { AuthPage } from "./auth-page";

export function AuthRouteFallback() {
  return (
    <AuthPage>
      <Card
        className="w-full max-w-lg overflow-hidden rounded-3xl border-white/80 shadow-[0_24px_70px_rgba(151,19,63,0.14)]"
        aria-label="Loading account page"
        aria-busy="true"
      >
        <div className="from-brand-50 border-line space-y-4 border-b bg-gradient-to-br to-white px-6 py-8 sm:px-9">
          <Skeleton className="h-8 w-36 rounded-full" />
          <Skeleton className="h-10 w-4/5 rounded-xl" />
          <Skeleton className="h-5 w-full rounded-lg" />
        </div>
        <CardContent className="space-y-5 p-6 sm:p-9">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </CardContent>
      </Card>
    </AuthPage>
  );
}
