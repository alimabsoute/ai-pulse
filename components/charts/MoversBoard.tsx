import type { Filters, Repo } from "@/lib/types";
import { compactNumber, pct, signedNumber } from "@/lib/format";
import { queryString } from "@/lib/pulse";
import Link from "next/link";

export function MoversBoard({
  repos,
  filters,
  basePath = "/movers",
}: {
  repos: Repo[];
  filters: Filters;
  basePath?: string;
}) {
  const withMove = repos.filter((r) => r.starsAdded !== null && r.pctChange !== null);
  const byPct = [...withMove].sort((a, b) => (b.pctChange ?? 0) - (a.pctChange ?? 0)).slice(0, 12);
  const byAbs = [...withMove].sort((a, b) => (b.starsAdded ?? 0) - (a.starsAdded ?? 0)).slice(0, 12);
  const maxAbs = Math.max(1, ...byAbs.map((r) => r.starsAdded ?? 0));
  const maxPct = Math.max(1, ...byPct.map((r) => r.pctChange ?? 0));

  if (!withMove.length) {
    return (
      <p className="border border-line bg-panel p-4 text-sm text-mute">
        No velocity figures for this window, so the movers board is empty. Pulse will not fabricate
        a percent change.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Column
        title="Absolute"
        subtitle="Stars added"
        rows={byAbs}
        filters={filters}
        basePath={basePath}
        max={maxAbs}
        value={(r) => signedNumber(r.starsAdded)}
        width={(r) => ((r.starsAdded ?? 0) / maxAbs) * 100}
      />
      <Column
        title="Percent"
        subtitle="Change vs prior"
        rows={byPct}
        filters={filters}
        basePath={basePath}
        max={maxPct}
        value={(r) => pct(r.pctChange, 0)}
        width={(r) => ((r.pctChange ?? 0) / maxPct) * 100}
      />
    </div>
  );
}

function Column({
  title,
  subtitle,
  rows,
  filters,
  basePath,
  value,
  width,
}: {
  title: string;
  subtitle: string;
  rows: Repo[];
  filters: Filters;
  basePath: string;
  max: number;
  value: (r: Repo) => string;
  width: (r: Repo) => number;
}) {
  return (
    <section className="border border-line bg-panel">
      <header className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <h3 className="font-display text-2xl text-paper">{title}</h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">{subtitle}</p>
      </header>
      <ol>
        {rows.map((r, i) => (
          <li key={r.id} className="border-b border-line last:border-0">
            <Link
              href={`${basePath}${queryString(filters, { repo: r.fullName })}`}
              scroll={false}
              className="relative flex min-h-14 items-center gap-3 px-4 py-2.5"
            >
              <span
                className="absolute inset-y-0 left-0 bg-gold/10"
                style={{ width: `${Math.min(100, Math.max(2, width(r)))}%` }}
                aria-hidden
              />
              <span className="relative w-6 font-mono text-[11px] text-mute">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="relative min-w-0 flex-1 truncate font-mono text-sm text-paper">
                {r.name}
              </span>
              <span className="relative font-mono text-sm tabular text-mint">{value(r)}</span>
              <span className="relative hidden font-mono text-[11px] text-mute sm:inline">
                ★ {compactNumber(r.stars)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
