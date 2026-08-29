import * as cheerio from "cheerio";
import type { RangeKey, Repo, SourceStatus, VelocityPoint } from "./types";
import { fetchJson, fetchText } from "./http";
import { isoDateDaysAgo, parseCount } from "./format";
import { computeHeat, keywordHits, pctChange } from "./heat";

type RawRepo = {
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  starsAdded: Partial<Record<"1d" | "7d" | "30d", number>>;
  topics: string[];
  createdAt: string | null;
  pushedAt: string | null;
  avatarUrl: string | null;
  source: Set<"trending" | "search">;
};

const WINDOW_DAYS: Record<"1d" | "7d" | "30d", number> = { "1d": 1, "7d": 7, "30d": 30 };

const SKIP_OWNERS = new Set([
  "trending",
  "topics",
  "search",
  "settings",
  "login",
  "orgs",
  "users",
  "explore",
  "sponsors",
  "about",
  "pricing",
  "features",
  "enterprise",
  "marketplace",
  "collections",
  "events",
  "codespaces",
  "copilot",
  "security",
  "blog",
  "site",
  "apps",
  "notifications",
  "pulls",
  "issues",
  "gist",
  "solutions",
  "resources",
  "open-source",
  "customer-stories",
  "organizations",
  "account",
]);

function windowKey(range: RangeKey): "1d" | "7d" | "30d" {
  if (range === "today") return "1d";
  if (range === "7d") return "7d";
  return "30d";
}

function emptyRaw(owner: string, name: string): RawRepo {
  return {
    owner,
    name,
    description: null,
    language: null,
    stars: 0,
    forks: 0,
    starsAdded: {},
    topics: [],
    createdAt: null,
    pushedAt: null,
    avatarUrl: null,
    source: new Set(),
  };
}

function mergeInto(target: Map<string, RawRepo>, incoming: RawRepo) {
  const key = `${incoming.owner}/${incoming.name}`.toLowerCase();
  const prev = target.get(key);
  if (!prev) {
    target.set(key, incoming);
    return;
  }
  prev.description = prev.description || incoming.description;
  prev.language = prev.language || incoming.language;
  prev.stars = Math.max(prev.stars, incoming.stars);
  prev.forks = Math.max(prev.forks, incoming.forks);
  prev.createdAt = prev.createdAt || incoming.createdAt;
  prev.pushedAt = prev.pushedAt || incoming.pushedAt;
  prev.avatarUrl = prev.avatarUrl || incoming.avatarUrl;
  for (const t of incoming.topics) {
    if (!prev.topics.includes(t)) prev.topics.push(t);
  }
  for (const [w, n] of Object.entries(incoming.starsAdded) as Array<
    ["1d" | "7d" | "30d", number]
  >) {
    prev.starsAdded[w] = Math.max(prev.starsAdded[w] ?? 0, n);
  }
  incoming.source.forEach((s) => prev.source.add(s));
}

function parseFigure(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const s = raw.trim().replace(/,/g, "");
  const m = s.match(/^([\d.]+)\s*([kKmM])?$/);
  if (!m) return parseCount(raw);
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const suf = (m[2] || "").toLowerCase();
  if (suf === "k") return Math.round(n * 1000);
  if (suf === "m") return Math.round(n * 1_000_000);
  return n;
}

export function parseTrendingHtml(html: string, window: "1d" | "7d" | "30d"): RawRepo[] {
  const $ = cheerio.load(html);
  const out: RawRepo[] = [];
  $("article.Box-row").each((_, el) => {
    const $el = $(el);
    const href = $el.find("h2 a").attr("href") || "";
    const parts = href.split("/").filter(Boolean);
    if (parts.length < 2) return;
    const owner = parts[0];
    const name = parts[1];
    const description = $el.find("p").first().text().replace(/\s+/g, " ").trim() || null;
    const language = $el.find("[itemprop=programmingLanguage]").first().text().trim() || null;
    const stars = parseCount($el.find('a[href$="/stargazers"]').first().text()) ?? 0;
    const forks = parseCount($el.find('a[href$="/forks"]').first().text()) ?? 0;
    const velMatch = $el
      .text()
      .replace(/\s+/g, " ")
      .match(/([\d,]+)\s+stars\s+(today|this week|this month)/i);
    const added = velMatch ? parseCount(velMatch[1]) : null;
    const raw = emptyRaw(owner, name);
    raw.description = description;
    raw.language = language;
    raw.stars = stars;
    raw.forks = forks;
    if (added !== null) raw.starsAdded[window] = added;
    raw.source.add("trending");
    out.push(raw);
  });
  return out;
}

/** Parse jina.ai reader markdown of github.com/trending. Never invents star counts. */
export function parseTrendingMarkdown(md: string, window: "1d" | "7d" | "30d"): RawRepo[] {
  const linkRe =
    /\[([A-Za-z0-9_.-]+)\s*\/\s*([A-Za-z0-9_.-]+)\]\(https?:\/\/github\.com\/\1\/\2(?:\/)?(?:[?#][^)]*)?\)/gi;
  const matches: Array<{ owner: string; name: string; index: number }> = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(md))) {
    const owner = m[1];
    const name = m[2];
    if (SKIP_OWNERS.has(owner.toLowerCase())) continue;
    if (/^(stargazers|forks|network|issues|pulls|actions|security|pulse)$/i.test(name)) continue;
    const key = `${owner}/${name}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    matches.push({ owner, name, index: m.index });
  }

  const out: RawRepo[] = [];
  for (let i = 0; i < matches.length; i++) {
    const { owner, name, index } = matches[i];
    const end = i + 1 < matches.length ? matches[i + 1].index : Math.min(index + 1800, md.length);
    const block = md.slice(index, end);
    const raw = emptyRaw(owner, name);

    const starLink = block.match(
      /\[([^\]]+)\]\(https?:\/\/github\.com\/[^)]+\/stargazers\)/,
    );
    const forkLink = block.match(
      /\[([^\]]+)\]\(https?:\/\/github\.com\/[^)]+\/(?:network\/members|forks)\)/,
    );
    const stars = starLink ? parseFigure(starLink[1]) : null;
    const forks = forkLink ? parseFigure(forkLink[1]) : null;
    if (stars !== null) raw.stars = stars;
    if (forks !== null) raw.forks = forks;

    const velMatch = block
      .replace(/\s+/g, " ")
      .match(/([\d,]+)\s+stars\s+(today|this week|this month)/i);
    if (velMatch) {
      const added = parseCount(velMatch[1]);
      if (added !== null) raw.starsAdded[window] = added;
    }

    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines.slice(1, 10)) {
      if (line.startsWith("[") || line.startsWith("#") || line.startsWith("!")) continue;
      if (/stars\s+(today|this week|this month)/i.test(line)) continue;
      const text = line.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
      if (text.length > 12) {
        raw.description = text;
        break;
      }
    }

    raw.source.add("trending");
    out.push(raw);
  }
  return out;
}

type GhSearchItem = {
  full_name?: string;
  name?: string;
  owner?: { login?: string; avatar_url?: string };
  html_url?: string;
  description?: string | null;
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  topics?: string[];
  created_at?: string;
  pushed_at?: string;
};

type GhSearchResponse = { items?: GhSearchItem[]; total_count?: number };

function fromSearch(item: GhSearchItem): RawRepo | null {
  const owner = item.owner?.login;
  const name = item.name;
  if (!owner || !name) return null;
  const raw = emptyRaw(owner, name);
  raw.description = item.description ?? null;
  raw.language = item.language ?? null;
  raw.stars = item.stargazers_count ?? 0;
  raw.forks = item.forks_count ?? 0;
  raw.topics = item.topics ?? [];
  raw.createdAt = item.created_at ?? null;
  raw.pushedAt = item.pushed_at ?? null;
  raw.avatarUrl = item.owner?.avatar_url ?? null;
  raw.source.add("search");
  return raw;
}

function isTrendingHtml(html: string): boolean {
  return html.includes("article") && html.includes("Box-row");
}

async function fetchTrendingWindow(
  window: "1d" | "7d" | "30d",
): Promise<{ repos: RawRepo[]; status: SourceStatus }> {
  const since = window === "1d" ? "daily" : window === "7d" ? "weekly" : "monthly";
  const url = `https://github.com/trending?since=${since}`;
  const res = await fetchText(url);
  let repos: RawRepo[] = [];
  let statusCode = res.status;
  let error: string | undefined;

  if (res.ok) {
    if (!isTrendingHtml(res.data)) {
      error = "block_page";
    } else {
      repos = parseTrendingHtml(res.data, window);
      if (repos.length === 0) error = "empty_trending";
    }
  } else {
    error = res.error;
  }

  if (repos.length === 0) {
    const proxyUrl = `https://r.jina.ai/http://github.com/trending?since=${since}`;
    const proxy = await fetchText(proxyUrl);
    if (proxy.ok) {
      const fromMd = parseTrendingMarkdown(proxy.data, window);
      if (fromMd.length > 0) {
        repos = fromMd;
        statusCode = proxy.status;
        error = undefined;
      } else {
        error = error ?? "empty_proxy";
        statusCode = statusCode || proxy.status;
      }
    } else {
      error = error ?? proxy.error;
      statusCode = statusCode || proxy.status;
    }
  }

  if (repos.length === 0) {
    return {
      repos: [],
      status: {
        id: "github-trending",
        ok: false,
        status: statusCode,
        error: error ?? "empty_trending",
        count: 0,
      },
    };
  }

  return {
    repos,
    status: { id: "github-trending", ok: true, status: statusCode, count: repos.length },
  };
}

async function fetchRepoSearch(
  query: string,
): Promise<{ repos: RawRepo[]; ok: boolean; status: number; error?: string }> {
  const q = encodeURIComponent(query);
  const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=30`;
  const res = await fetchJson<GhSearchResponse>(url, { github: true });
  if (!res.ok) {
    return { repos: [], ok: false, status: res.status, error: res.error };
  }
  const repos = (res.data.items ?? []).map(fromSearch).filter((r): r is RawRepo => r !== null);
  return { repos, ok: true, status: res.status };
}

function searchDays(range: RangeKey): number {
  if (range === "today") return 7;
  if (range === "7d") return 14;
  return 30;
}

async function fetchAiSearch(range: RangeKey): Promise<{ repos: RawRepo[]; status: SourceStatus }> {
  const since = isoDateDaysAgo(searchDays(range));
  // GitHub Search rejects OR across qualifiers (422). A single topic qualifier is valid.
  const result = await fetchRepoSearch(`topic:ai created:>${since}`);
  if (!result.ok) {
    return {
      repos: [],
      status: {
        id: "github-search",
        ok: false,
        status: result.status,
        error: result.error,
        count: 0,
      },
    };
  }
  return {
    repos: result.repos,
    status: { id: "github-search", ok: true, status: result.status, count: result.repos.length },
  };
}

async function fetchPopularPushedSearch(
  range: RangeKey,
): Promise<{ repos: RawRepo[]; status: SourceStatus }> {
  const since = isoDateDaysAgo(searchDays(range));
  const result = await fetchRepoSearch(`stars:>1000 pushed:>${since}`);
  if (!result.ok) {
    return {
      repos: [],
      status: {
        id: "github-search",
        ok: false,
        status: result.status,
        error: result.error,
        count: 0,
      },
    };
  }
  return {
    repos: result.repos,
    status: { id: "github-search", ok: true, status: result.status, count: result.repos.length },
  };
}

function toRepo(raw: RawRepo, range: RangeKey, rank: number): Repo {
  const selected = windowKey(range);
  const starsAdded = raw.starsAdded[selected] ?? null;
  const velocity: VelocityPoint[] = (["30d", "7d", "1d"] as const)
    .filter((w) => raw.starsAdded[w] !== undefined)
    .map((w) => ({
      window: w,
      starsAdded: raw.starsAdded[w] as number,
      dailyRate: (raw.starsAdded[w] as number) / WINDOW_DAYS[w],
    }));
  const text = `${raw.name} ${raw.description ?? ""} ${raw.topics.join(" ")}`;
  const signals = keywordHits(text);
  return {
    id: `${raw.owner}/${raw.name}`,
    owner: raw.owner,
    name: raw.name,
    fullName: `${raw.owner}/${raw.name}`,
    url: `https://github.com/${raw.owner}/${raw.name}`,
    description: raw.description,
    language: raw.language,
    stars: raw.stars,
    forks: raw.forks,
    starsAdded,
    pctChange: pctChange(raw.stars, starsAdded),
    heat: computeHeat({
      stars: raw.stars,
      starsAdded,
      pushedAt: raw.pushedAt,
      text,
    }),
    topics: raw.topics,
    signals,
    createdAt: raw.createdAt,
    pushedAt: raw.pushedAt,
    avatarUrl: raw.avatarUrl,
    velocity,
    source: Array.from(raw.source),
    rank,
  };
}

export async function loadGithub(range: RangeKey): Promise<{
  repos: Repo[];
  sources: SourceStatus[];
}> {
  const selectedWindow = windowKey(range);
  const otherWindows = (["1d", "7d", "30d"] as const).filter((w) => w !== selectedWindow);

  const [primary, search, ...others] = await Promise.all([
    fetchTrendingWindow(selectedWindow),
    fetchAiSearch(range),
    ...otherWindows.map(fetchTrendingWindow),
  ]);

  const trendingParts = [primary, ...others];
  const trendingCount = trendingParts.reduce((n, s) => n + s.repos.length, 0);

  let extra: { repos: RawRepo[]; status: SourceStatus } | null = null;
  if (trendingCount === 0) {
    extra = await fetchPopularPushedSearch(range);
  }

  const map = new Map<string, RawRepo>();
  for (const bundle of [primary, ...others, search, extra].filter(Boolean) as Array<{
    repos: RawRepo[];
  }>) {
    for (const r of bundle.repos) mergeInto(map, r);
  }

  const merged = Array.from(map.values()).map((raw, i) => toRepo(raw, range, i));
  merged.sort(
    (a, b) => b.heat - a.heat || (b.starsAdded ?? 0) - (a.starsAdded ?? 0) || b.stars - a.stars,
  );
  merged.forEach((r, i) => {
    r.rank = i + 1;
  });

  const trendingOk = trendingParts.some((s) => s.status.ok);
  const trendingFail = trendingParts.find((s) => !s.status.ok)?.status;

  const searchOk = search.status.ok || Boolean(extra?.status.ok);
  const searchCount = search.status.count + (extra?.status.count ?? 0);
  const searchFail = search.status.ok ? extra?.status : search.status;

  const sources: SourceStatus[] = [
    {
      id: "github-trending",
      ok: trendingOk,
      status: trendingOk ? 200 : trendingFail?.status,
      error: trendingOk ? undefined : trendingFail?.error,
      count: trendingCount,
    },
    {
      id: "github-search",
      ok: searchOk,
      status: searchOk ? 200 : searchFail?.status,
      error: searchOk ? undefined : searchFail?.error,
      count: searchCount,
    },
  ];

  return { repos: merged, sources };
}

export { windowKey };
