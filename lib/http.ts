export const CACHE_SECONDS = 86_400;

export const UA =
  "Mozilla/5.0 (compatible; Pulse/1.0; public AI+GitHub trend dashboard)";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 15_000;

export const MEDIA_TIMEOUT_MS = 8_000;

export type FetchResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; data: null; status: number; error: string };

type PulseInit = RequestInit & { next?: unknown; github?: boolean; timeoutMs?: number };

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function timeoutReject(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("timeout")), ms);
  });
}

/** Timeout without attaching AbortSignal to fetch (Next.js cached fetch + abort throws on Vercel). */
function fetchNoSignal(
  url: string,
  init: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  return Promise.race([fetch(url, init), timeoutReject(timeoutMs)]);
}

function fetchErrorReason(err: unknown): string {
  let detail = String(err);
  if (err instanceof Error && err.cause != null) {
    detail = `${detail} (${String(err.cause)})`;
  }
  const name = err instanceof Error ? err.name : "";
  if (name === "TimeoutError" || name === "AbortError" || /timeout/i.test(detail)) {
    return `timeout: ${detail}`;
  }
  if (err instanceof TypeError) {
    return `network: ${detail}`;
  }
  return detail;
}

function withoutSignalOrNext(init?: PulseInit): RequestInit {
  if (!init) return {};
  const {
    signal: _signal,
    next: _next,
    github: _github,
    timeoutMs: _timeoutMs,
    headers: _headers,
    ...rest
  } = init;
  return rest;
}

export async function fetchText(
  url: string,
  init?: RequestInit & { github?: boolean; timeoutMs?: number },
): Promise<FetchResult<string>> {
  try {
    const rest = withoutSignalOrNext(init);
    const extra = init?.github ? githubHeaders() : {};
    const res = await fetchNoSignal(
      url,
      {
        ...rest,
        headers: {
          "User-Agent": init?.github ? UA : BROWSER_UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          ...extra,
          ...(init?.headers ?? {}),
        },
      },
      init?.timeoutMs ?? FETCH_TIMEOUT_MS,
    );
    if (res.status === 403 || res.status === 429) {
      return { ok: false, data: null, status: res.status, error: "rate_limited" };
    }
    if (!res.ok) {
      return { ok: false, data: null, status: res.status, error: `http_${res.status}` };
    }
    return { ok: true, data: await res.text(), status: res.status };
  } catch (err) {
    console.error("[pulse fetch]", url, err);
    return { ok: false, data: null, status: 0, error: fetchErrorReason(err) };
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit & { github?: boolean; timeoutMs?: number },
): Promise<FetchResult<T>> {
  try {
    const rest = withoutSignalOrNext(init);
    const extra = init?.github ? githubHeaders() : {};
    const res = await fetchNoSignal(
      url,
      {
        ...rest,
        headers: {
          "User-Agent": UA,
          Accept: "application/json",
          ...extra,
          ...(init?.headers ?? {}),
        },
      },
      init?.timeoutMs ?? FETCH_TIMEOUT_MS,
    );
    if (res.status === 403 || res.status === 429) {
      return { ok: false, data: null, status: res.status, error: "rate_limited" };
    }
    if (!res.ok) {
      return { ok: false, data: null, status: res.status, error: `http_${res.status}` };
    }
    return { ok: true, data: (await res.json()) as T, status: res.status };
  } catch (err) {
    console.error("[pulse fetch]", url, err);
    return { ok: false, data: null, status: 0, error: fetchErrorReason(err) };
  }
}
