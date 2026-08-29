import Link from "next/link";

export default function NotFound() {
  return (
    <div className="border border-line bg-panel p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">404</p>
      <h1 className="mt-2 font-display text-4xl text-paper">Off the tape.</h1>
      <p className="mt-2 text-sm text-mute">That route does not exist.</p>
      <Link
        href="/"
        className="mt-4 inline-flex min-h-11 items-center border border-gold bg-gold px-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink"
      >
        Home
      </Link>
    </div>
  );
}
