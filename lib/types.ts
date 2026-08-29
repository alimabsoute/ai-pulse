export type RangeKey = "today" | "7d" | "30d";

export type SourceStatus = {
  id: "github-trending" | "github-search" | "hf-models" | "hf-datasets" | "hf-spaces" | "arxiv";
  ok: boolean;
  status?: number;
  error?: string;
  count: number;
};

export type VelocityPoint = {
  /** Window label, e.g. "30d", "7d", "1d" */
  window: "30d" | "7d" | "1d";
  /** Stars gained in that window. Omitted windows are not invented. */
  starsAdded: number;
  /** Daily rate = starsAdded / windowDays. Derived, not estimated beyond the window. */
  dailyRate: number;
};

export type Repo = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  /** Stars gained in the selected window, when GitHub trending reports it. */
  starsAdded: number | null;
  /** (starsAdded / max(1, stars - starsAdded)) * 100 when both are known. */
  pctChange: number | null;
  heat: number;
  topics: string[];
  /** Keyword signals inferred from name/description when GitHub topics are absent. */
  signals: string[];
  createdAt: string | null;
  pushedAt: string | null;
  avatarUrl: string | null;
  velocity: VelocityPoint[];
  source: Array<"trending" | "search">;
  rank: number;
};

export type HfItem = {
  id: string;
  kind: "model" | "dataset" | "space";
  url: string;
  likes: number | null;
  downloads: number | null;
  pipeline: string | null;
  tags: string[];
  createdAt: string | null;
  heat: number;
};

export type Paper = {
  id: string;
  title: string;
  url: string;
  summary: string;
  published: string;
  authors: string[];
};

export type Snapshot = {
  fetchedAt: string;
  range: RangeKey;
  repos: Repo[];
  models: HfItem[];
  datasets: HfItem[];
  spaces: HfItem[];
  papers: Paper[];
  sources: SourceStatus[];
  languages: { name: string; count: number; stars: number }[];
  topics: { name: string; count: number }[];
};

export type Filters = {
  range: RangeKey;
  topic: string;
  language: string;
};
