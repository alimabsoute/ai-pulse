import type { Metadata } from "next";
import { FilterBar } from "@/components/filters/FilterBar";
import { HeatBarChart } from "@/components/charts/Charts";
import { RepoCard } from "@/components/repos/RepoCard";
import { RepoSheet } from "@/components/repos/RepoSheet";
import { SectionHead, SourceBanner, UpdatedStamp, EmptyNote } from "@/components/ui/Meta";
import { loadPage } from "@/lib/page-data";


export const runtime = "nodejs";
export const maxDuration = 60;
export const revalidate = 600;
export const metadata: Metadata = { title: "Repos" };

export default async function ReposPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { filters, snapshot, repos, selected, closeHref } = await loadPage(searchParams);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHead kicker="GitHub" title="Trending repos" />
        <UpdatedStamp iso={snapshot.fetchedAt} />
        <div className="mt-2">
          <SourceBanner sources={snapshot.sources.filter((s) => s.id.startsWith("github"))} />
        </div>
      </div>
      <FilterBar filters={filters} snapshot={snapshot} basePath="/repos" />
      {repos.length ? (
        <div className="border border-line bg-panel p-3 md:p-4">
          <HeatBarChart repos={repos} />
        </div>
      ) : null}
      {repos.length ? (
        <div className="reveal-list grid gap-3">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} filters={filters} basePath="/repos" />
          ))}
        </div>
      ) : (
        <EmptyNote>No repositories for this filter. Sources may be rate-limited.</EmptyNote>
      )}
      {selected ? <RepoSheet repo={selected} closeHref={closeHref("/repos")} /> : null}
    </div>
  );
}
