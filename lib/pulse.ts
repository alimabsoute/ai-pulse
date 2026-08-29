import { unstable_cache } from "next/cache";
import type { Filters, RangeKey, Repo, Snapshot } from "./types";
import { loadGithub } from "./github";
import { loadHuggingFace } from "./huggingface";
import { loadArxiv } from "./arxiv";
import { CACHE_SECONDS } from "./http";

function tallies(repos: Repo[]): Pick<Snapshot, "languages" | "topics"> {
  const lang = new Map<string, { count: number; stars: number }>();
  const topic = new Map<string, number>();
  for (const r of repos) {
    if (r.language) {
      const cur = lang.get(r.language) ?? { count: 0, stars: 0 };
      cur.count += 1;
      cur.stars += r.stars;
      lang.set(r.language, cur);
    }
    const labels = r.topics.length ? r.topics : r.signals;
    for (const t of labels) {
      topic.set(t, (topic.get(t) ?? 0) + 1);
    }
  }
  return {
    languages: Array.from(lang.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.stars - a.stars),
    topics: Array.from(topic.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 24),
  };
}

async function buildSnapshot(range: RangeKey): Promise<Snapshot> {
  const [gh, hf, arxiv] = await Promise.all([loadGithub(range), loadHuggingFace(), loadArxiv()]);
  const { languages, topics } = tallies(gh.repos);
  return {
    fetchedAt: new Date().toISOString(),
    range,
    repos: gh.repos,
    models: hf.models,
    datasets: hf.datasets,
    spaces: hf.spaces,
    papers: arxiv.papers,
    sources: [...gh.sources, ...hf.sources, arxiv.status],
    languages,
    topics,
  };
}

export function getSnapshot(range: RangeKey): Promise<Snapshot> {
  const cached = unstable_cache(
    async () => buildSnapshot(range),
    ["pulse-snapshot", range],
    { revalidate: CACHE_SECONDS, tags: ["pulse", `pulse-${range}`] },
  );
  return cached();
}

export function parseFilters(sp: Record<string, string | string[] | undefined> | undefined): Filters {
  const pick = (k: string) => {
    const v = sp?.[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const rangeRaw = pick("range");
  const range: RangeKey = rangeRaw === "7d" || rangeRaw === "30d" ? rangeRaw : "today";
  return {
    range,
    topic: pick("topic") || "all",
    language: pick("language") || "all",
  };
}

export function filterRepos(repos: Repo[], filters: Filters): Repo[] {
  return repos.filter((r) => {
    if (filters.language !== "all" && r.language !== filters.language) return false;
    if (filters.topic !== "all") {
      const t = filters.topic.toLowerCase();
      const hay = [...r.topics, ...r.signals, r.name, r.description ?? ""].join(" ").toLowerCase();
      if (!hay.includes(t)) return false;
    }
    return true;
  });
}

export function queryString(
  current: Filters,
  patch: Partial<Filters> & { repo?: string | null },
  extras?: Record<string, string | undefined>,
): string {
  const p = new URLSearchParams();
  const range = patch.range ?? current.range;
  const topic = patch.topic ?? current.topic;
  const language = patch.language ?? current.language;
  if (range !== "today") p.set("range", range);
  if (topic !== "all") p.set("topic", topic);
  if (language !== "all") p.set("language", language);
  if (patch.repo) p.set("repo", patch.repo);
  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v) p.set(k, v);
    }
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const TOPIC_CHIPS = ["all", "ai", "llm", "agents", "ml", "infra"] as const;
