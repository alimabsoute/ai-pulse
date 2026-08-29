import Link from "next/link";
import type { Filters, Repo } from "@/lib/types";
import { compactNumber, pct, signedNumber } from "@/lib/format";
import { queryString } from "@/lib/pulse";
import { Sparkline } from "@/components/charts/Sparkline";

export function RepoCard({
  repo,
  filters,
  basePath = "/",
}: {
  repo: Repo;
  filters: Filters;
  basePath?: string;
}) {
  const href = `${basePath}${queryString(filters, { repo: repo.fullName })}`;
  const tags = (repo.topics.length ? repo.topics : repo.signals).slice(0, 3);
  const spark = repo.velocity.map((v) => v.dailyRate);

  return (
    <Link
      href={href}
      scroll={false}
      className="block min-h-11 border border-line bg-panel p-4 transition-colors active:border-gold/50 md:hover:border-gold/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-[11px] text-mute">
            {repo.rank.toString().padStart(2, "0")} · {repo.owner}
          </p>
          <h3 className="truncate font-display text-xl text-paper">{repo.name}</h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-lg tabular text-gold">{repo.heat}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">heat</p>
        </div>
      </div>
      {repo.description ? (
        <p className="mt-2 line-clamp-2 text-sm leading-snug text-paper-dim">{repo.description}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-mute">
        {repo.language ? <span className="text-paper-dim">{repo.language}</span> : null}
        <span>★ {compactNumber(repo.stars)}</span>
        <span>⑂ {compactNumber(repo.forks)}</span>
        {repo.starsAdded !== null ? (
          <span className="text-mint">{signedNumber(repo.starsAdded)}</span>
        ) : null}
        {repo.pctChange !== null ? <span>{pct(repo.pctChange, 0)}</span> : null}
        {spark.length >= 2 ? <Sparkline values={spark} className="ml-auto text-gold" /> : null}
      </div>
      {tags.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-sm border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-mute"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
