import type { Repo } from "@/lib/types";
import { compactNumber, formatStamp, pct, signedNumber } from "@/lib/format";
import { Sparkline } from "@/components/charts/Sparkline";
import { VelocityAreaChart } from "@/components/charts/Charts";

export function RepoDetail({ repo }: { repo: Repo }) {
  const spark = repo.velocity.map((v) => v.dailyRate);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
          {repo.owner}
        </p>
        <h2 className="font-display text-3xl text-paper">{repo.name}</h2>
        {repo.description ? (
          <p className="mt-2 text-sm leading-relaxed text-paper-dim">{repo.description}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
        <Mini k="Stars" v={compactNumber(repo.stars)} />
        <Mini k="Velocity" v={signedNumber(repo.starsAdded)} mint={!!repo.starsAdded} />
        <Mini k="Change" v={pct(repo.pctChange)} />
        <Mini k="Heat" v={String(repo.heat)} gold />
      </div>

      {spark.length >= 2 ? (
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Star velocity · daily rate by window
          </p>
          <Sparkline values={spark} width={220} height={48} />
          <div className="mt-3">
            <VelocityAreaChart repos={[repo]} />
          </div>
        </div>
      ) : repo.starsAdded !== null ? (
        <p className="font-mono text-xs text-mute">
          Window velocity is {signedNumber(repo.starsAdded)}. Additional windows were not reported
          for this repo, so a sparkline is omitted.
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 font-mono text-xs text-mute">
        <div>
          <dt>Language</dt>
          <dd className="text-paper">{repo.language ?? "—"}</dd>
        </div>
        <div>
          <dt>Forks</dt>
          <dd className="text-paper">{compactNumber(repo.forks)}</dd>
        </div>
        {repo.createdAt ? (
          <div>
            <dt>Created</dt>
            <dd className="text-paper">{formatStamp(repo.createdAt)}</dd>
          </div>
        ) : null}
        {repo.pushedAt ? (
          <div>
            <dt>Pushed</dt>
            <dd className="text-paper">{formatStamp(repo.pushedAt)}</dd>
          </div>
        ) : null}
      </dl>

      {repo.topics.length ? (
        <div className="flex flex-wrap gap-1.5">
          {repo.topics.map((t) => (
            <span
              key={t}
              className="rounded-sm border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-paper-dim"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <a
        href={repo.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center justify-center border border-gold bg-gold px-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink"
      >
        Open on GitHub
      </a>
    </div>
  );
}

function Mini({
  k,
  v,
  gold,
  mint,
}: {
  k: string;
  v: string;
  gold?: boolean;
  mint?: boolean;
}) {
  return (
    <div className="bg-ink-2 px-3 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">{k}</p>
      <p
        className={`mt-1 font-mono text-xl tabular ${
          gold ? "text-gold" : mint ? "text-mint" : "text-paper"
        }`}
      >
        {v}
      </p>
    </div>
  );
}
