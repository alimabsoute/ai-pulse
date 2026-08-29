import { daysBetween } from "./format";

/**
 * Heat score (0–100)
 * --------------------
 * Quantifies how "hot" a repo is right now. Only terms backed by a real
 * observation are used. Missing terms are omitted and remaining weights
 * are renormalized — we never invent a velocity, recency, or star count.
 *
 * logNorm(x, cap) = min(1, log10(1 + x) / log10(1 + cap))
 * recency(days, horizon) = max(0, 1 - days / horizon)
 *
 * Default weights:
 *   stars     0.30  logNorm(stargazers, 80_000)
 *   velocity  0.45  logNorm(starsAddedInWindow, 4_000)
 *   recency   0.15  recency(daysSincePush, 45)
 *   signal    0.10  min(1, aiKeywordHits / 3)
 *
 * heat = round(100 * sum(weight_i * component_i) / sum(weight_i present))
 *
 * Hugging Face items use likes + downloads with the same logNorm shape
 * (see hfHeat). Papers are not scored.
 */
export const AI_KEYWORDS = [
  "ai",
  "llm",
  "gpt",
  "agent",
  "agents",
  "ml",
  "machine-learning",
  "deep-learning",
  "neural",
  "transformer",
  "diffusion",
  "inference",
  "rag",
  "embedding",
  "openai",
  "anthropic",
  "claude",
  "langchain",
  "ollama",
  "vllm",
  "cuda",
  "gpu",
  "model",
  "dataset",
] as const;

const WEIGHTS = {
  stars: 0.3,
  velocity: 0.45,
  recency: 0.15,
  signal: 0.1,
} as const;

function logNorm(x: number, cap: number): number {
  if (x <= 0) return 0;
  return Math.min(1, Math.log10(1 + x) / Math.log10(1 + cap));
}

export function keywordHits(text: string): string[] {
  const hay = text.toLowerCase();
  const hits: string[] = [];
  for (const k of AI_KEYWORDS) {
    const re = new RegExp(`(^|[^a-z0-9])${k}([^a-z0-9]|$)`, "i");
    if (re.test(hay)) hits.push(k);
  }
  return hits;
}

export function computeHeat(input: {
  stars: number;
  starsAdded: number | null;
  pushedAt: string | null;
  text: string;
}): number {
  const terms: Array<{ w: number; v: number }> = [];
  terms.push({ w: WEIGHTS.stars, v: logNorm(input.stars, 80_000) });
  if (input.starsAdded !== null && input.starsAdded >= 0) {
    terms.push({ w: WEIGHTS.velocity, v: logNorm(input.starsAdded, 4_000) });
  }
  const sincePush = daysBetween(input.pushedAt);
  if (sincePush !== null) {
    terms.push({ w: WEIGHTS.recency, v: Math.max(0, 1 - sincePush / 45) });
  }
  const hits = keywordHits(input.text);
  terms.push({ w: WEIGHTS.signal, v: Math.min(1, hits.length / 3) });
  const wsum = terms.reduce((s, t) => s + t.w, 0) || 1;
  return Math.round((100 * terms.reduce((s, t) => s + t.w * t.v, 0)) / wsum);
}

export function hfHeat(likes: number | null, downloads: number | null): number {
  const terms: Array<{ w: number; v: number }> = [];
  if (likes !== null) terms.push({ w: 0.55, v: logNorm(likes, 8_000) });
  if (downloads !== null) terms.push({ w: 0.45, v: logNorm(downloads, 2_000_000) });
  if (!terms.length) return 0;
  const wsum = terms.reduce((s, t) => s + t.w, 0);
  return Math.round((100 * terms.reduce((s, t) => s + t.w * t.v, 0)) / wsum);
}

export function pctChange(stars: number, starsAdded: number | null): number | null {
  if (starsAdded === null) return null;
  const prev = Math.max(1, stars - starsAdded);
  return (starsAdded / prev) * 100;
}
