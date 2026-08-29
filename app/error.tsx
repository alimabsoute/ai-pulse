"use client";

export default function ErrorView({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="border border-rose/40 bg-panel p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-rose">Fault</p>
      <h1 className="mt-2 font-display text-3xl text-paper">The tape broke.</h1>
      <p className="mt-2 text-sm text-mute">{error.message || "Unexpected render error."}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 inline-flex min-h-11 items-center border border-gold bg-gold px-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink"
      >
        Retry
      </button>
    </div>
  );
}
