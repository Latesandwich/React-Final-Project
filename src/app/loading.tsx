// App Router streams this fallback while the next page's server data is loading.
export default function Loading() {
  return (
    <main className="cg-shell py-10" role="status" aria-busy="true">
      <p className="text-sm text-neutral-400">กำลังโหลดหน้า…</p>
      <div aria-hidden="true" className="mt-6 grid gap-6 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-64 animate-pulse rounded-2xl bg-neutral-800 motion-reduce:animate-none" />
        ))}
      </div>
    </main>
  );
}
