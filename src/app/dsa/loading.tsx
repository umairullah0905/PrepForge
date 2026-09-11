export default function DsaLoading() {
  return (
    <div className="qx-root flex flex-col min-h-screen bg-zinc-950 animate-pulse">
      {/* Navbar Skeleton */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 h-14" />

      <main className="flex-1 pb-16">
        <div className="qx-container pt-8">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-6 border-b border-zinc-800/80">
            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-zinc-850" />
              <div className="h-7 w-64 rounded bg-zinc-800" />
              <div className="h-3.5 w-96 rounded bg-zinc-850" />
            </div>
            <div className="h-8 w-48 rounded bg-zinc-900 border border-zinc-800" />
          </div>

          {/* Workspace Layout Skeleton: Sidebar + Main table */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Sidebar Skeleton */}
            <div className="w-full lg:w-60 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 space-y-2 shrink-0">
              <div className="h-4 w-24 rounded bg-zinc-850 mb-3" />
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-7 rounded bg-zinc-950 w-full" />
              ))}
            </div>

            {/* Table Area Skeleton */}
            <div className="flex-1 w-full space-y-4">
              <div className="h-12 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 flex justify-between">
                <div className="h-6 w-48 rounded bg-zinc-950" />
                <div className="h-6 w-36 rounded bg-zinc-950" />
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-9 rounded bg-zinc-950/70 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
