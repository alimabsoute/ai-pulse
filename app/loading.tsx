export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <div className="h-3 w-40 bg-panel" />
      <div className="h-48 border border-line bg-panel" />
      <div className="grid gap-3">
        <div className="h-28 border border-line bg-panel" />
        <div className="h-28 border border-line bg-panel" />
        <div className="h-28 border border-line bg-panel" />
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute">Pulling the tape…</p>
    </div>
  );
}
