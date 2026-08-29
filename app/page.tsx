import { Hero } from "@/components/hero/Hero";
import { FilterBar } from "@/components/filters/FilterBar";
import { HeatBarChart, LanguageChart, VelocityAreaChart } from "@/components/charts/Charts";
import { Heatmap } from "@/components/charts/Heatmap";
import { MoversBoard } from "@/components/charts/MoversBoard";
import { RepoCard } from "@/components/repos/RepoCard";
import { RepoSheet } from "@/components/repos/RepoSheet";
import { Ticker } from "@/components/motion/Ticker";
import { SectionHead, SourceBanner, UpdatedStamp, EmptyNote } from "@/components/ui/Meta";
import { loadPage } from "@/lib/page-data";
import { rangeLabel } from "@/lib/format";


export const revalidate = 600;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { filters, snapshot, repos, selected, closeHref } = await loadPage(searchParams);
  const hero =
    [...repos].sort((a, b) => (b.starsAdded ?? -1) - (a.starsAdded ?? -1) || b.heat - a.heat)[0] ??
    null;
  const window = rangeLabel(filters.range);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <UpdatedStamp iso={snapshot.fetchedAt} />
        <SourceBanner sources={snapshot.sources} />
      </div>

      <FilterBar filters={filters} snapshot={snapshot} basePath="/" />

      <Ticker repos={repos} />

      <Hero repo={hero} rangeLabel={window} filters={filters} />

      <section>
        <SectionHead kicker="Visual" title="Hottest repos" />
        {repos.length ? (
          <div className="border border-line bg-panel p-3 md:p-4">
            <HeatBarChart repos={repos} />
          </div>
        ) : (
          <EmptyNote>No repos to rank for this filter.</EmptyNote>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section>
          <SectionHead kicker="Velocity" title="Star rate" />
          {repos.some((r) => r.velocity.length >= 2) ? (
            <div className="border border-line bg-panel p-3 md:p-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                Daily star rate across 30d / 7d / 1d windows · top names
              </p>
              <VelocityAreaChart repos={repos} />
            </div>
          ) : (
            <EmptyNote>
              Need a repo that appears in more than one trending window to draw a velocity area.
            </EmptyNote>
          )}
        </section>
        <section>
          <SectionHead kicker="Mix" title="Languages" />
          {snapshot.languages.length ? (
            <div className="border border-line bg-panel p-3 md:p-4">
              <LanguageChart languages={snapshot.languages} />
            </div>
          ) : (
            <EmptyNote>No language field on the current set.</EmptyNote>
          )}
        </section>
      </div>

      <section>
        <SectionHead kicker="Activity" title="Heatmap" />
        {repos.length ? (
          <Heatmap repos={repos} />
        ) : (
          <EmptyNote>No repos to map for this filter.</EmptyNote>
        )}
      </section>

      <section>
        <SectionHead kicker="Board" title="Movers" />
        <MoversBoard repos={repos} filters={filters} basePath="/" />
      </section>

      <section>
        <SectionHead kicker="Feed" title="Trending repos" aside={
          <span className="font-mono text-[11px] text-mute">{repos.length}</span>
        } />
        {repos.length ? (
          <div className="reveal-list grid gap-3">
            {repos.slice(0, 12).map((repo) => (
              <RepoCard key={repo.id} repo={repo} filters={filters} basePath="/" />
            ))}
          </div>
        ) : (
          <EmptyNote>Nothing matched these filters.</EmptyNote>
        )}
      </section>

      {selected ? <RepoSheet repo={selected} closeHref={closeHref("/")} /> : null}
    </div>
  );
}
