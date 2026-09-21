"use client";

import { useEffect, useMemo, useState } from "react";
import type { Repo } from "@/lib/types";
import { signedNumber } from "@/lib/format";

export function Ticker({ repos }: { repos: Repo[] }) {
  const items = useMemo(() => {
    const movers = [...repos]
      .sort((a, b) => {
        const av = Math.abs(a.starsAdded ?? -1);
        const bv = Math.abs(b.starsAdded ?? -1);
        if (bv !== av) return bv - av;
        return b.heat - a.heat;
      })
      .slice(0, 18);

    return movers.map((r) => ({
      id: r.id,
      name: r.name,
      value: r.starsAdded !== null ? signedNumber(r.starsAdded) : `heat ${r.heat}`,
      mint: r.starsAdded !== null && r.starsAdded > 0,
    }));
  }, [repos]);

  // Marquee needs a doubled strip for seamless scroll. With reduced-motion (or before
  // mount), show a single pass so the same names are not painted twice in a row.
  const [loop, setLoop] = useState(items);

  useEffect(() => {
    if (!items.length) {
      setLoop([]);
      return;
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setLoop(items);
      return;
    }
    let base = items;
    while (base.length < 8) base = base.concat(items);
    setLoop(base.concat(base));
  }, [items]);

  if (!items.length) return null;

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
