"use client";

import { useState } from "react";
import type { Repo } from "@/lib/types";
import { compactNumber, pct, signedNumber } from "@/lib/format";

type Col = {
  key: string;
  label: string;
  get: (r: Repo) => number | null;
  format: (n: number) => string;
};

const COLS: Col[] = [
  {
    key: "1d",
    label: "1d",
    get: (r) => r.velocity.find((v) => v.window === "1d")?.starsAdded ?? null,
    format: signedNumber,
  },
  {
    key: "7d",
    label: "7d",
    get: (r) => r.velocity.find((v) => v.window === "7d")?.starsAdded ?? null,
    format: signedNumber,
  },
  {
    key: "30d",
    label: "30d",
    get: (r) => r.velocity.find((v) => v.window === "30d")?.starsAdded ?? null,
    format: signedNumber,
  },
  {
    key: "heat",
    label: "heat",
    get: (r) => r.heat,
    format: (n) => String(Math.round(n)),
  },
  {
    key: "stars",
    label: "★",
    get: (r) => r.stars,
    format: compactNumber,
  },
  {
    key: "forks",
    label: "⑂",
    get: (r) => r.forks,
    format: compactNumber,
  },
  {
    key: "pct",
    label: "%",
    get: (r) => r.pctChange,
    format: (n) => pct(n, 0),
  },
];

function goldFill(t: number): string {
  const a = 0.1 + t * 0.82;
  return `rgba(240, 162, 2, ${a})`;
}

function maxima(rows: Repo[]): Record<string, number> {
  const max: Record<string, number> = {};
  for (const c of COLS) {
    let m = 0;
    for (const r of rows) {
      const v = c.get(r);
      if (v !== null && Number.isFinite(v)) m = Math.max(m, Math.abs(v));
    }
    max[c.key] = m || 1;
  }
  return max;
}

export function Heatmap({ repos }: { repos: Repo[] }) {
  const rows = repos.slice(0, 8);
  const max = maxima(rows);
  const [tip, setTip] = useState<string | null>(null);

  if (!rows.length) return null;

  return (
    <div className="border border-line bg-panel p-3 md:p-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
        Reported windows and scores · blank = not reported · gold is intensity within each column
      </p>
      <div className="-mx-1 overflow-x-auto px-1">
        <div
          className="grid min-w-[20rem] gap-1"
          style={{
            gridTemplateColumns: "minmax(5.25rem, 8rem) repeat(7, minmax(1.85rem, 1fr))",
          }}
        >
          <div aria-hidden />
          {COLS.map((c) => (
            <div
              key={c.key}
              className="pb-1 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-mute"
            >
              {c.label}
            </div>
          ))}
          {rows.map((r) => (
            <Row key={r.id} repo={r} max={max} onTip={setTip} />
          ))}
        </div>
      </div>
      <p className="mt-3 min-h-4 font-mono text-[11px] text-paper-dim" aria-live="polite">
        {tip ?? "Tap a cell for the figure."}
      </p>
    </div>
  );
}

function Row({
  repo,
  max,
  onTip,
}: {
  repo: Repo;
  max: Record<string, number>;
  onTip: (s: string) => void;
}) {
  return (
    <>
      <div className="flex items-center truncate pr-2 font-mono text-[11px] text-paper">
        {repo.name}
      </div>
      {COLS.map((c) => {
        const raw = c.get(repo);
        const missing = raw === null || Number.isNaN(raw);
        const t = missing ? 0 : Math.min(1, Math.abs(raw) / max[c.key]);
        const label = missing ? "—" : c.format(raw);
        const text = `${repo.name} · ${c.label} · ${label}`;
        return (
          <button
            key={c.key}
            type="button"
            title={text}
            aria-label={text}
            onClick={() => onTip(text)}
            onFocus={() => onTip(text)}
            className="h-7 min-h-7 rounded-[2px] border border-line/80 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-gold"
            style={{ background: missing ? "var(--ink-2)" : goldFill(t) }}
          />
        );
      })}
    </>
  );
}
