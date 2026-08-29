import type { Metadata } from "next";
import { RadarList, PaperList } from "@/components/ai/Radar";
import { LanguageChart } from "@/components/charts/Charts";
import { SectionHead, SourceBanner, UpdatedStamp } from "@/components/ui/Meta";
import { loadPage } from "@/lib/page-data";


export const runtime = "nodejs";
export const maxDuration = 60;
export const revalidate = 86400;
export const metadata: Metadata = { title: "AI radar" };

export default async function AiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { snapshot } = await loadPage(searchParams);
  const hfSources = snapshot.sources.filter((s) => s.id.startsWith("hf") || s.id === "arxiv");
  return (
    <div className="flex flex-col gap-8">
      <div>
        <SectionHead kicker="Radar" title="The AI stack" />
        <p className="max-w-2xl text-sm text-paper-dim">
          Hugging Face models, datasets, and spaces ranked by a likes + downloads heat score.
          arXiv cs.AI is the research tape. Counts come from public APIs — if a field is missing,
          it is omitted.
        </p>
        <div className="mt-3">
          <UpdatedStamp iso={snapshot.fetchedAt} />
        </div>
        <div className="mt-2">
          <SourceBanner sources={hfSources} />
        </div>
      </div>

      <section>
        <SectionHead kicker="Models" title="Hottest weights" />
        <RadarList
          items={snapshot.models}
          empty="Hugging Face models API did not respond. Pulse will not invent likes or downloads."
        />
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <SectionHead kicker="Data" title="Datasets" />
          <RadarList
            items={snapshot.datasets}
            empty="Datasets API unavailable."
          />
        </section>
        <section>
          <SectionHead kicker="Apps" title="Spaces" />
          <RadarList items={snapshot.spaces} empty="Spaces API unavailable." />
        </section>
      </div>

      <section>
        <SectionHead kicker="Research" title="arXiv cs.AI" />
        <PaperList papers={snapshot.papers} />
      </section>

      {snapshot.languages.length ? (
        <section>
          <SectionHead kicker="Repos" title="Language mix on the GitHub tape" />
          <div className="border border-line bg-panel p-3 md:p-4">
            <LanguageChart languages={snapshot.languages} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
