import type { Filters, Repo } from "@/lib/types";
import { compactNumber, pct, signedNumber } from "@/lib/format";
import { Sparkline } from "@/components/charts/Sparkline";
import { queryString } from "@/lib/pulse";
import Link from "next/link";

export function Hero({
  repo,
  rangeLabel: window,
  filters,
  basePath = "/",
}: {
  repo: Repo | null;
  rangeLabel: string;
  filters: Filters;
  basePath?: string;
}) {
  if (!repo) {
    return (
      <section className="border border-line bg-panel px-4 py-8 md:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">The story</p>
        <h1 className="mt-3 font-display text-3xl leading-tight text-paper md:text-5xl">
          The tape is quiet.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-mute">
          Trending sources did not return repositories for this window. Pulse never invents numbers —
          try another range, or check back after the next refresh.
        </p>
      </section>
    );
  }

  const spark = repo.velocity.map((v) => v.dailyRate);
  const href = `${basePath}${queryString(filters, { repo: repo.fullName })}`;

  return (
    <section className="relative overflow-hidden border border-line bg-panel">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/10 blur-3xl" aria-hidden />
      <div className="px-4 py-6 md:px-8 md:py-8">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">The story</p>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
            {window} tape
          </span>
        </div>
        <Link href={href} scroll={false} className="mt-3 block min-h-11">
          <p className="font-mono text-xs text-mute">
            {repo.owner}/<span className="text-paper-dim">{repo.name}</span>
          </p>
          <h1 className="mt-1 font-display text-[2rem] leading-[1.1] tracking-tight text-paper sm:text-4xl md:text-5xl">
            {headline(repo, window)}
          </h1>
        </Link>
        {repo.description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper-dim md:text-base">
            {repo.description}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          <Stat k="Stars" v={compactNumber(repo.stars)} />
          <Stat
            k={`${window} velocity`}
            v={signedNumber(repo.starsAdded)}
            tone={repo.starsAdded && repo.starsAdded > 0 ? "mint" : undefined}
          />
          <Stat k="% change" v={pct(repo.pctChange)} tone={repo.pctChange && repo.pctChange > 0 ? "mint" : undefined} />
          <Stat k="Heat" v={String(repo.heat)} gold />
        </div>

        {spark.length >= 2 ? (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
              Daily star rate · 30d → 7d → 1d
            </p>
            <Sparkline values={spark} width={120} height={32} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Stat({
  k,
  v,
  gold,
  tone,
}: {
  k: string;
  v: string;
  gold?: boolean;
  tone?: "mint";
}) {
  return (
    <div className="bg-ink-2 px-3 py-3 md:px-4 md:py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">{k}</p>
      <p
        className={`mt-1 font-mono text-2xl tabular leading-none md:text-3xl ${
          gold ? "text-gold" : tone === "mint" ? "text-mint" : "text-paper"
        }`}
      >
        {v}
      </p>
    </div>
  );
}

function headline(repo: Repo, window: string): string {
  if (repo.starsAdded && repo.starsAdded >= 1000) {
    return `${repo.name} is ripping. ${compactNumber(repo.starsAdded)} stars ${window === "24h" ? "in 24 hours" : window}.`;
  }
  if (repo.starsAdded && repo.starsAdded > 0) {
    return `${repo.name} leads the tape — ${compactNumber(repo.starsAdded)} new stars ${window}.`;
  }
  return `${repo.name} is the heat. Score ${repo.heat}.`;
}
