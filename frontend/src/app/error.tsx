"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-brand-700 text-sm font-semibold">Unexpected error</p>
      <h1 className="text-ink mt-3 text-3xl font-bold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-ink-muted mt-4">
        Please try again. If the problem continues, contact support.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-brand-600 hover:bg-brand-700 focus-visible:outline-brand-600 mt-8 rounded-full px-6 py-3 font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Try again
      </button>
    </main>
  );
}
