import type { Repo } from "@/lib/types";
import { signedNumber } from "@/lib/format";

export function Ticker({ repos }: { repos: Repo[] }) {
  const movers = [...repos]
    .sort((a, b) => {
      const av = Math.abs(a.starsAdded ?? -1);
      const bv = Math.abs(b.starsAdded ?? -1);
      if (bv !== av) return bv - av;
      return b.heat - a.heat;
    })
    .slice(0, 18);

  if (!movers.length) return null;

  const items = movers.map((r) => ({
    id: r.id,
    name: r.name,
    value: r.starsAdded !== null ? signedNumber(r.starsAdded) : `heat ${r.heat}`,
    mint: r.starsAdded !== null && r.starsAdded > 0,
  }));

  let base = items;
  while (base.length < 8) base = base.concat(items);
  const loop = base.concat(base);

  return (
    <div
      className="ticker -mx-4 border-y border-line bg-ink-2 md:mx-0 md:border"
      tabIndex={0}
      aria-label="Notable movers"
    >
      <div className="ticker-track">
        {loop.map((it, i) => (
          <span key={`${it.id}-${i}`} className="ticker-item">
            <span className="text-paper">{it.name}</span>
            <span className={it.mint ? "text-mint" : "text-gold"}>{it.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
