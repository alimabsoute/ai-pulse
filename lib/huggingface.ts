import type { HfItem, SourceStatus } from "./types";
import { fetchJson } from "./http";
import { hfHeat } from "./heat";

type HfApiItem = {
  id?: string;
  likes?: number;
  downloads?: number;
  pipeline_tag?: string;
  tags?: string[];
  createdAt?: string;
};

async function loadKind(
  kind: HfItem["kind"],
  path: string,
): Promise<{ items: HfItem[]; status: SourceStatus }> {
  const id =
    kind === "model" ? "hf-models" : kind === "dataset" ? "hf-datasets" : "hf-spaces";
  const url = `https://huggingface.co/api/${path}?sort=likes&direction=-1&limit=24`;
  const res = await fetchJson<HfApiItem[]>(url);
  if (!res.ok) {
    return {
      items: [],
      status: { id, ok: false, status: res.status, error: res.error, count: 0 },
    };
  }
  const items: HfItem[] = (res.data ?? [])
    .filter((row) => typeof row.id === "string" && row.id.length > 0)
    .map((row) => {
      const likes = typeof row.likes === "number" ? row.likes : null;
      const downloads = typeof row.downloads === "number" ? row.downloads : null;
      const slug = row.id as string;
      const prefix = kind === "dataset" ? "datasets" : kind === "space" ? "spaces" : "";
      const urlPath = prefix ? `${prefix}/${slug}` : slug;
      return {
        id: slug,
        kind,
        url: `https://huggingface.co/${urlPath}`,
        likes,
        downloads,
        pipeline: row.pipeline_tag ?? null,
        tags: (row.tags ?? []).slice(0, 8),
        createdAt: row.createdAt ?? null,
        heat: hfHeat(likes, downloads),
      };
    })
    .sort((a, b) => b.heat - a.heat);
  return {
    items,
    status: { id, ok: true, status: res.status, count: items.length },
  };
}

export async function loadHuggingFace(): Promise<{
  models: HfItem[];
  datasets: HfItem[];
  spaces: HfItem[];
  sources: SourceStatus[];
}> {
  const [models, datasets, spaces] = await Promise.all([
    loadKind("model", "models"),
    loadKind("dataset", "datasets"),
    loadKind("space", "spaces"),
  ]);
  return {
    models: models.items,
    datasets: datasets.items,
    spaces: spaces.items,
    sources: [models.status, datasets.status, spaces.status],
  };
}
