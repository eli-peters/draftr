"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center px-4">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-base text-muted-foreground max-w-80 mx-auto">
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
