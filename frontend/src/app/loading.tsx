export default function Loading() {
  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16 lg:px-8"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="bg-brand-50 h-72 w-full animate-pulse rounded-3xl" />
    </main>
  );
}
