export default function RootLoading() {
  return (
    <div className="qx-root flex flex-col min-h-screen bg-zinc-950 animate-pulse">
      {/* Navbar Skeleton */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 h-14" />

      <main className="flex-1 pb-16">
        <div className="qx-container pt-8 max-w-7xl">
          {/* Header Skeleton */}
          <div className="pb-6 mb-6 border-b border-zinc-800/80 space-y-2">
            <div className="h-4 w-32 rounded bg-zinc-850" />
            <div className="h-7 w-64 rounded bg-zinc-800" />
            <div className="h-3.5 w-96 rounded bg-zinc-850" />
          </div>

          {/* Cards / Table Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="h-24 rounded-lg border border-zinc-800 bg-zinc-900/40" />
            <div className="h-24 rounded-lg border border-zinc-800 bg-zinc-900/40" />
            <div className="h-24 rounded-lg border border-zinc-800 bg-zinc-900/40" />
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <div className="h-9 w-60 rounded bg-zinc-950" />
            <div className="space-y-2 pt-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 rounded bg-zinc-950/60 w-full" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
