import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-brand-700 text-sm font-semibold">404</p>
      <h1 className="text-ink mt-3 text-3xl font-bold tracking-tight">
        Page not found
      </h1>
      <p className="text-ink-muted mt-4">
        The page you requested does not exist or has moved.
      </p>
      <Link
        href="/"
        className="bg-brand-600 hover:bg-brand-700 focus-visible:outline-brand-600 mt-8 rounded-full px-6 py-3 font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Return home
      </Link>
    </main>
  );
}
