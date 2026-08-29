import { unstable_cache } from "next/cache";
import * as cheerio from "cheerio";
import { CACHE_SECONDS, MEDIA_TIMEOUT_MS, fetchJson, fetchText } from "./http";

export type RepoStill = {
  src: string;
  alt: string;
  kind: "image" | "gif" | "video";
};

export type RepoClip = {
  id: string;
  title: string;
  embedUrl: string;
};

export type RepoTalk = {
  source: "x" | "hn" | "reddit";
  title: string;
  url: string;
  body?: string;
  author?: string;
  points?: number;
};

export type RepoMedia = {
  fullName: string;
  ogImage: string;
  stills: RepoStill[];
  clips: RepoClip[];
  talks: RepoTalk[];
  youtubeSearchUrl: string;
  xSearchUrl: string;
};

type GhContent = {
  name?: string;
  path?: string;
  type?: string;
  download_url?: string | null;
};

const MEDIA_FILE = /\.(png|jpe?g|gif|webp|mp4|webm|mov)$/i;
const MEDIA_DIRS = /^(docs|assets|screenshots|images|img|media|static|\.github)$/i;
const BADGE_RE =
  /shields\.io|badge|travis-ci|codecov|workflow|actions\/workflows|dependabot|circleci|coveralls|snyk\.io|commit-activity|github-readme-stats|buymeacoffee|liberapay|opencollective|\.svg(?:$|\?)/i;

const YT_ENDPOINTS = [
  (q: string) => `https://pipedapi.kavin.rocks/search?q=${q}&filter=videos`,
  (q: string) => `https://api.piped.private.coffee/search?q=${q}&filter=videos`,
  (q: string) => `https://invidious.fdn.fr/api/v1/search?q=${q}&type=video`,
  (q: string) => `https://y.com.sb/api/v1/search?q=${q}&type=video`,
];

export function githubOgUrl(owner: string, name: string): string {
  return `https://opengraph.githubassets.com/1/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function kindOf(src: string): RepoStill["kind"] {
  const lower = src.toLowerCase();
  if (/\.(mp4|webm|mov)(?:$|\?)/.test(lower)) return "video";
  if (/\.gif(?:$|\?)/.test(lower)) return "gif";
  return "image";
}

function isBadge(src: string, alt: string): boolean {
  return BADGE_RE.test(`${src} ${alt}`);
}

function rewriteGithubFileUrl(raw: string): string {
  const blob = raw.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/([^/]+)\/(.+)$/i,
  );
  if (blob) {
    return `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}/${blob[3]}/${blob[4]}`;
  }
  return raw;
}

function resolveMediaSrc(src: string, owner: string, name: string): string | null {
  const raw = src.trim();
  if (!raw || raw.startsWith("data:")) return null;
  if (raw.startsWith("//")) return rewriteGithubFileUrl(`https:${raw}`);
  if (/^https?:\/\//i.test(raw)) return rewriteGithubFileUrl(raw);
  const path = raw.replace(/^\.\//, "").replace(/^\/+/, "");
  if (!path) return null;
  return `https://raw.githubusercontent.com/${owner}/${name}/HEAD/${path}`;
}

function dedupeStills(items: RepoStill[], cap: number): RepoStill[] {
  const seen = new Set<string>();
  const out: RepoStill[] = [];
  for (const item of items) {
    const key = item.src.split("?")[0].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= cap) break;
  }
  return out;
}

function youtubeId(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const m =
    raw.match(/[?&]v=([\w-]{11})/) ||
    raw.match(/youtu\.be\/([\w-]{11})/) ||
    raw.match(/\/embed\/([\w-]{11})/) ||
    raw.match(/\/shorts\/([\w-]{11})/) ||
    raw.match(/\/watch\?v=([\w-]{11})/);
  if (m) return m[1];
  if (/^[\w-]{11}$/.test(raw)) return raw;
  return null;
}

async function readmeStills(owner: string, name: string): Promise<RepoStill[]> {
  const res = await fetchText(`https://api.github.com/repos/${owner}/${name}/readme`, {
    github: true,
    timeoutMs: MEDIA_TIMEOUT_MS,
    headers: { Accept: "application/vnd.github.html+json" },
  });
  if (!res.ok) return [];
  const $ = cheerio.load(res.data);
  const found: RepoStill[] = [];
  $("img").each((_, el) => {
    const $el = $(el);
    const src = $el.attr("data-canonical-src") || $el.attr("src") || "";
    const alt = ($el.attr("alt") || "").trim();
    const resolved = resolveMediaSrc(src, owner, name);
    if (!resolved || isBadge(resolved, alt)) return;
    if (!MEDIA_FILE.test(resolved.split("?")[0]) && !/githubusercontent|opengraph|user-images/i.test(resolved)) {
      if (!/\.(png|jpe?g|gif|webp)/i.test(resolved)) return;
    }
    found.push({ src: resolved, alt: alt || "README image", kind: kindOf(resolved) });
  });
  $("video, video source").each((_, el) => {
    const src = $(el).attr("src") || "";
    const resolved = resolveMediaSrc(src, owner, name);
    if (!resolved) return;
    found.push({ src: resolved, alt: "README video", kind: "video" });
  });
  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const resolved = resolveMediaSrc(href, owner, name);
    if (!resolved || !MEDIA_FILE.test(resolved.split("?")[0])) return;
    if (isBadge(resolved, $(el).text())) return;
    found.push({
      src: resolved,
      alt: ($(el).text() || "README media").trim(),
      kind: kindOf(resolved),
    });
  });
  return found;
}

async function contentStills(owner: string, name: string): Promise<RepoStill[]> {
  const root = await fetchJson<GhContent[]>(
    `https://api.github.com/repos/${owner}/${name}/contents/`,
    { github: true, timeoutMs: MEDIA_TIMEOUT_MS },
  );
  if (!root.ok || !Array.isArray(root.data)) return [];
  const found: RepoStill[] = [];
  const dirs: string[] = [];
  for (const row of root.data) {
    if (row.type === "file" && row.name && MEDIA_FILE.test(row.name) && row.download_url) {
      found.push({ src: row.download_url, alt: row.name, kind: kindOf(row.name) });
    }
    if (row.type === "dir" && row.name && MEDIA_DIRS.test(row.name)) dirs.push(row.name);
  }
  const nested = await Promise.all(
    dirs.slice(0, 4).map((dir) =>
      fetchJson<GhContent[]>(`https://api.github.com/repos/${owner}/${name}/contents/${dir}`, {
        github: true,
        timeoutMs: MEDIA_TIMEOUT_MS,
      }),
    ),
  );
  for (const res of nested) {
    if (!res.ok || !Array.isArray(res.data)) continue;
    for (const row of res.data) {
      if (row.type === "file" && row.name && MEDIA_FILE.test(row.name) && row.download_url) {
        found.push({ src: row.download_url, alt: row.name, kind: kindOf(row.name) });
      }
    }
  }
  return found;
}

type PipedSearch = {
  items?: Array<{ url?: string; title?: string; type?: string; thumbnail?: string }>;
};

type InvidiousHit = {
  type?: string;
  videoId?: string;
  title?: string;
  videoThumbnails?: Array<{ url?: string }>;
};

type ClipRow = {
  url?: string;
  title?: string;
  type?: string;
  videoId?: string;
};

function clipsFromUnknown(data: unknown): RepoClip[] {
  const out: RepoClip[] = [];
  const rows: unknown[] = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as PipedSearch).items)
      ? ((data as PipedSearch).items as unknown[])
      : [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as ClipRow & InvidiousHit;
    const type = (r.type || "").toLowerCase();
    if (type && type !== "stream" && type !== "video") continue;
    const id = youtubeId(r.videoId) || youtubeId(r.url);
    if (!id) continue;
    const title = (r.title || "YouTube video").trim();
    out.push({
      id,
      title,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    });
    if (out.length >= 3) break;
  }
  return out;
}

async function fetchClips(owner: string, name: string): Promise<RepoClip[]> {
  const q = encodeURIComponent(`${owner} ${name}`);
  const results = await Promise.all(
    YT_ENDPOINTS.map((make) => fetchJson<unknown>(make(q), { timeoutMs: MEDIA_TIMEOUT_MS })),
  );
  for (const res of results) {
    if (!res.ok) continue;
    const clips = clipsFromUnknown(res.data);
    if (clips.length) return clips.slice(0, 3);
  }
  return [];
}

type HnHit = {
  title?: string;
  url?: string | null;
  points?: number;
  author?: string;
  objectID?: string;
  story_text?: string;
};

type RedditListing = {
  data?: {
    children?: Array<{
      data?: {
        title?: string;
        permalink?: string;
        author?: string;
        score?: number;
        selftext?: string;
      };
    }>;
  };
};

async function fetchTalks(fullName: string): Promise<RepoTalk[]> {
  const encoded = encodeURIComponent(fullName);
  const [rssTw, rssX, hn, reddit] = await Promise.all([
    fetchText(`https://rsshub.app/twitter/keyword/${encoded}`, { timeoutMs: MEDIA_TIMEOUT_MS }),
    fetchText(`https://rsshub.app/x/keyword/${encoded}`, { timeoutMs: MEDIA_TIMEOUT_MS }),
    fetchJson<{ hits?: HnHit[] }>(
      `https://hn.algolia.com/api/v1/search?query=${encoded}&tags=story`,
      { timeoutMs: MEDIA_TIMEOUT_MS },
    ),
    fetchJson<RedditListing>(
      `https://www.reddit.com/search.json?q=${encoded}&sort=hot&limit=8`,
      { timeoutMs: MEDIA_TIMEOUT_MS },
    ),
  ]);

  const tweets: RepoTalk[] = [];
  for (const rss of [rssTw, rssX]) {
    if (!rss.ok) continue;
    const $ = cheerio.load(rss.data, { xml: true });
    $("item").each((_, el) => {
      const title = stripHtml($(el).find("title").first().text());
      const link = $(el).find("link").first().text().trim();
      const description = stripHtml($(el).find("description").first().text());
      const author =
        $(el).find("author, dc\\:creator, creator").first().text().trim() || undefined;
      if (!title || !link) return;
      tweets.push({
        source: "x",
        title,
        url: link,
        body: description && description !== title ? description.slice(0, 280) : undefined,
        author,
      });
    });
    if (tweets.length) break;
  }

  const hnTalks: RepoTalk[] = [];
  if (hn.ok) {
    for (const hit of hn.data.hits ?? []) {
      const title = (hit.title || "").trim();
      if (!title) continue;
      const url = hit.url || (hit.objectID ? `https://news.ycombinator.com/item?id=${hit.objectID}` : "");
      if (!url) continue;
      hnTalks.push({
        source: "hn",
        title,
        url,
        author: hit.author,
        points: typeof hit.points === "number" ? hit.points : undefined,
        body: hit.story_text ? stripHtml(hit.story_text).slice(0, 280) : undefined,
      });
    }
  }

  const redditTalks: RepoTalk[] = [];
  if (reddit.ok) {
    for (const child of reddit.data.data?.children ?? []) {
      const d = child.data;
      if (!d?.title || !d.permalink) continue;
      redditTalks.push({
        source: "reddit",
        title: d.title,
        url: `https://www.reddit.com${d.permalink}`,
        author: d.author,
        points: typeof d.score === "number" ? d.score : undefined,
        body: d.selftext ? stripHtml(d.selftext).slice(0, 280) : undefined,
      });
    }
  }

  const merged: RepoTalk[] = [];
  const seen = new Set<string>();
  for (const item of [...tweets, ...hnTalks, ...redditTalks]) {
    const key = item.url.split("?")[0];
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= 8) break;
  }
  return merged;
}

async function loadRepoMedia(owner: string, name: string): Promise<RepoMedia> {
  const fullName = `${owner}/${name}`;
  const [readme, contents, clips, talks] = await Promise.all([
    readmeStills(owner, name),
    contentStills(owner, name),
    fetchClips(owner, name),
    fetchTalks(fullName),
  ]);
  const ogImage = githubOgUrl(owner, name);
  const stills = dedupeStills(
    [...readme, ...contents].filter((s) => s.src.split("?")[0] !== ogImage),
    12,
  );
  return {
    fullName,
    ogImage,
    stills,
    clips,
    talks,
    youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${owner} ${name}`)}`,
    xSearchUrl: `https://x.com/search?q=${encodeURIComponent(fullName)}&src=typed_query&f=live`,
  };
}

export function getRepoMedia(owner: string, name: string): Promise<RepoMedia> {
  const fullName = `${owner}/${name}`;
  const cached = unstable_cache(
    async () => loadRepoMedia(owner, name),
    ["repo-media", fullName.toLowerCase()],
    { revalidate: CACHE_SECONDS, tags: ["repo-media"] },
  );
  return cached();
}
