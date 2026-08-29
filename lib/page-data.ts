import type { Filters, Repo, Snapshot } from "./types";
import { filterRepos, getSnapshot, parseFilters, queryString } from "./pulse";

export async function loadPage(
  searchParams: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>,
): Promise<{
  filters: Filters;
  snapshot: Snapshot;
  repos: Repo[];
  selected: Repo | null;
  closeHref: (path: string) => string;
  repoParam: string | null;
}> {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const snapshot = await getSnapshot(filters.range);
  const repos = filterRepos(snapshot.repos, filters);
  const raw = sp.repo;
  const repoParam = Array.isArray(raw) ? raw[0] : raw ?? null;
  const selected =
    repoParam
      ? snapshot.repos.find((r) => r.fullName.toLowerCase() === repoParam.toLowerCase()) ?? null
      : null;
  return {
    filters,
    snapshot,
    repos,
    selected,
    closeHref: (path: string) => `${path}${queryString(filters, { repo: null })}`,
    repoParam,
  };
}
