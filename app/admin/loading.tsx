/** Shown inside the admin shell while an admin page loads: a header and card placeholders. */
export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true">
        <div className="h-3 w-20 animate-pulse rounded bg-sand" />
        <div className="mt-4 h-9 w-64 max-w-full animate-pulse rounded bg-sand" />
        <div className="mt-4 h-4 w-96 max-w-full animate-pulse rounded bg-sand" />
        <ul className="mt-10 flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex flex-col gap-3 rounded-card border border-line bg-white p-5">
              <div className="h-6 w-2/3 animate-pulse rounded bg-sand" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-sand" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-sand" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
