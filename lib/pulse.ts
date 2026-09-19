import { unstable_cache } from "next/cache";
import type { Filters, RangeKey, Repo, Snapshot, SourceStatus } from "./types";
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

/** How long a failed source read is held before it is tried again. */
const RETRY_SECONDS = 600;

class SourceFailed<T> extends Error {
  constructor(readonly result: T) {
    super("source_failed");
  }
}

/**
 * Cache each source on its own, and only keep a read for the full day when every
 * part of it succeeded. A failed read used to be cached for 24h along with the rest
 * of the snapshot, so one 429 meant a "Degraded" banner until the next day.
 * Now: good reads live for CACHE_SECONDS, failed reads for RETRY_SECONDS, and while
 * a source is failing the last good read keeps being served if there is one.
 */
function resilient<T extends object>(
  key: string[],
  load: () => Promise<T>,
  statuses: (r: T) => SourceStatus[],
): () => Promise<T & { fetchedAt: string }> {
  const good = unstable_cache(
    async () => {
      const r = await load();
      if (statuses(r).some((s) => !s.ok)) throw new SourceFailed(r);
      return { ...r, fetchedAt: new Date().toISOString() };
    },
    [...key, "good"],
    { revalidate: CACHE_SECONDS, tags: ["pulse"] },
  );
  return unstable_cache(
    async () => {
      try {
        return await good();
      } catch (err) {
        if (err instanceof SourceFailed) {
          return { ...(err.result as T), fetchedAt: new Date().toISOString() };
        }
        throw err;
      }
    },
    [...key, "attempt"],
    { revalidate: RETRY_SECONDS, tags: ["pulse"] },
  );
}

async function buildSnapshot(range: RangeKey): Promise<Snapshot> {
  const [gh, hf, arxiv] = await Promise.all([
    resilient(["pulse-github", range], () => loadGithub(range), (r) => r.sources)(),
    resilient(["pulse-hf"], loadHuggingFace, (r) => r.sources)(),
    resilient(["pulse-arxiv"], loadArxiv, (r) => [r.status])(),
  ]);
  const { languages, topics } = tallies(gh.repos);
  return {
    // The repo tape is the headline data, so the stamp follows it.
    fetchedAt: gh.fetchedAt,
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
  return buildSnapshot(range);
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
