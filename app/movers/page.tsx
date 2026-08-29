import type { Metadata } from "next";
import { FilterBar } from "@/components/filters/FilterBar";
import { MoversBoard } from "@/components/charts/MoversBoard";
import { VelocityAreaChart } from "@/components/charts/Charts";
import { Heatmap } from "@/components/charts/Heatmap";
import { RepoWorkspace } from "@/components/repos/RepoWorkspace";
import { Ticker } from "@/components/motion/Ticker";
import { SectionHead, SourceBanner, UpdatedStamp, EmptyNote } from "@/components/ui/Meta";
import { loadPage } from "@/lib/page-data";

export const runtime = "nodejs";
export const maxDuration = 60;
export const revalidate = 86400;
export const metadata: Metadata = { title: "Movers" };

export default async function MoversPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { filters, snapshot, repos, selected, closeHref } = await loadPage(searchParams);
  if (selected) {
    return <RepoWorkspace repo={selected} closeHref={closeHref("/movers")} />;
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHead kicker="Tape" title="Movers" />
        <p className="max-w-xl text-sm text-paper-dim">
          Absolute stars added in the window, and percent change versus the implied prior total
          (stars − window velocity). If GitHub did not report a window figure, the repo is left off
          this board.
        </p>
        <div className="mt-3">
          <UpdatedStamp iso={snapshot.fetchedAt} />
        </div>
        <div className="mt-2">
          <SourceBanner sources={snapshot.sources.filter((s) => s.id.startsWith("github"))} />
        </div>
      </div>
      <FilterBar filters={filters} snapshot={snapshot} basePath="/movers" />
      <Ticker repos={repos} />
      {repos.some((r) => r.velocity.length >= 2) ? (
        <div className="border border-line bg-panel p-3 md:p-4">
          <VelocityAreaChart repos={repos} />
        </div>
      ) : (
        <EmptyNote>Need overlapping trending windows to draw velocity over time.</EmptyNote>
      )}
      {repos.length ? <Heatmap repos={repos} /> : null}
      <MoversBoard repos={repos} filters={filters} basePath="/movers" />
    </div>
  );
}
