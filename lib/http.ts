const REVALIDATE = 600; // 10 minutes — within the 5–15m product window

export const UA =
  "Mozilla/5.0 (compatible; Pulse/1.0; public AI+GitHub trend dashboard)";

export type FetchResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; data: null; status: number; error: string };

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function fetchText(
  url: string,
  init?: RequestInit,
): Promise<FetchResult<string>> {
  try {
    const res = await fetch(url, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(15_000),
      next: { revalidate: REVALIDATE },
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...(init?.headers ?? {}),
      },
    });
    if (res.status === 403 || res.status === 429) {
      return { ok: false, data: null, status: res.status, error: "rate_limited" };
    }
    if (!res.ok) {
      return { ok: false, data: null, status: res.status, error: `http_${res.status}` };
    }
    return { ok: true, data: await res.text(), status: res.status };
  } catch {
    return { ok: false, data: null, status: 0, error: "network" };
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit & { github?: boolean },
): Promise<FetchResult<T>> {
  try {
    const { github, headers: initHeaders, ...rest } = init ?? {};
    const extra = github ? githubHeaders() : {};
    const res = await fetch(url, {
      ...rest,
      signal: rest.signal ?? AbortSignal.timeout(15_000),
      next: { revalidate: REVALIDATE },
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
        ...extra,
        ...(initHeaders ?? {}),
      },
    });
    if (res.status === 403 || res.status === 429) {
      return { ok: false, data: null, status: res.status, error: "rate_limited" };
    }
    if (!res.ok) {
      return { ok: false, data: null, status: res.status, error: `http_${res.status}` };
    }
    return { ok: true, data: (await res.json()) as T, status: res.status };
  } catch {
    return { ok: false, data: null, status: 0, error: "network" };
  }
}

export const CACHE_SECONDS = REVALIDATE;
