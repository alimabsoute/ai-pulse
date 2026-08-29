import Image from "next/image";
import Link from "next/link";
import type { Filters, Repo } from "@/lib/types";
import { compactNumber, signedNumber } from "@/lib/format";
import { queryString } from "@/lib/pulse";
import { githubOgUrl } from "@/lib/repo-media";

export function ProductRow({
  repos,
  filters,
  basePath = "/",
}: {
  repos: Repo[];
  filters: Filters;
  basePath?: string;
}) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 md:snap-none">
      {repos.map((repo) => (
        <ProductCard key={repo.id} repo={repo} filters={filters} basePath={basePath} />
      ))}
    </div>
  );
}

function ProductCard({
  repo,
  filters,
  basePath,
}: {
  repo: Repo;
  filters: Filters;
  basePath: string;
}) {
  const href = `${basePath}${queryString(filters, { repo: repo.fullName })}`;
  return (
    <Link
      href={href}
      scroll={false}
      className="group min-w-[16.5rem] snap-start overflow-hidden border border-line bg-panel transition-colors active:border-gold/50 md:min-w-0 md:hover:border-gold/40"
    >
      <div className="relative aspect-[1.91/1] bg-ink-2">
        <Image
          src={githubOgUrl(repo.owner, repo.name)}
          alt={`${repo.fullName} preview`}
          fill
          sizes="(min-width: 768px) 25vw, 70vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-3">
        <p className="truncate font-mono text-[11px] text-mute">{repo.owner}</p>
        <h3 className="truncate font-display text-xl leading-tight text-paper">{repo.name}</h3>
        <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-mute">
          <span className={`tabular text-gold ${repo.heat >= 80 ? "heat-glow" : ""}`}>
            {repo.heat} heat
          </span>
          <span>★ {compactNumber(repo.stars)}</span>
          {repo.starsAdded !== null ? (
            <span className="text-mint">{signedNumber(repo.starsAdded)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
