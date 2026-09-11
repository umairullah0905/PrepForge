export default function ProfileLoading() {
  return (
    <div className="qx-root flex flex-col min-h-screen bg-zinc-950 animate-pulse">
      {/* Navbar Skeleton */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 h-14" />

      <main className="flex-1 pb-16">
        <div className="qx-container pt-8 max-w-5xl">
          {/* Header & Identity Card Skeleton */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 mb-6">
            <div className="flex items-center justify-between pb-6 border-b border-zinc-800/80">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg bg-zinc-850" />
                <div className="space-y-2">
                  <div className="h-5 w-40 rounded bg-zinc-800" />
                  <div className="h-3.5 w-48 rounded bg-zinc-850" />
                </div>
              </div>
              <div className="h-8 w-28 rounded bg-zinc-850" />
            </div>

            {/* Metric Row Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-2">
                <div className="h-3 w-20 rounded bg-zinc-850" />
                <div className="h-7 w-12 rounded bg-zinc-800" />
                <div className="h-3 w-32 rounded bg-zinc-850" />
              </div>
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-2">
                <div className="h-3 w-24 rounded bg-zinc-850" />
                <div className="h-7 w-20 rounded bg-zinc-800" />
                <div className="h-3 w-36 rounded bg-zinc-850" />
              </div>
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-2">
                <div className="h-3 w-20 rounded bg-zinc-850" />
                <div className="h-7 w-24 rounded bg-zinc-800" />
                <div className="h-3 w-28 rounded bg-zinc-850" />
              </div>
            </div>
          </div>

          {/* Linked accounts skeleton */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 mt-6 space-y-4">
            <div className="h-4 w-48 rounded bg-zinc-800" />
            <div className="h-3 w-96 rounded bg-zinc-850" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div className="h-9 rounded bg-zinc-950" />
              <div className="h-9 rounded bg-zinc-950" />
            </div>
          </div>

          {/* Submission History Table Skeleton */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 mt-6 p-4 space-y-3">
            <div className="h-4 w-36 rounded bg-zinc-800" />
            <div className="space-y-2 pt-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 rounded bg-zinc-950/80 w-full" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
