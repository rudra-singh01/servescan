'use client';

/** Full-screen overlay while data is loading from the server. */
export function FullScreenLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface/90 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
      <p className="mt-4 text-sm font-medium text-text-muted">{label}</p>
    </div>
  );
}
