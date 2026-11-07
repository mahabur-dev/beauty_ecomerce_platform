"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <section className="max-w-lg text-center" role="alert">
        <h1 className="text-2xl font-bold">
          The admin application could not continue.
        </h1>
        <p className="mt-3">
          Try the request again. If it continues to fail, use the request
          identifier from the API response when contacting support.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md border px-4 py-2 font-semibold"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
