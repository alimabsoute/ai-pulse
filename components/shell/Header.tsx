import Link from "next/link";

const DESKTOP = [
  { href: "/", label: "Home" },
  { href: "/repos", label: "Repos" },
  { href: "/ai", label: "AI" },
  { href: "/movers", label: "Movers" },
  { href: "/about", label: "Method" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 md:h-16 md:px-6">
        <Link href="/" className="group flex min-h-11 items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-sm border border-gold/40 bg-gold/10 font-mono text-[11px] font-semibold tracking-[0.18em] text-gold">
            P
          </span>
          <span className="leading-none">
            <span className="block font-display text-[1.35rem] tracking-tight text-paper">
              Pulse
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-mute md:block">
              AI · GitHub · tape
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {DESKTOP.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-paper-dim transition-colors hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
          <span className="live-dot" aria-hidden />
          <span className="text-gold">Live</span>
        </div>
      </div>
    </header>
  );
}
