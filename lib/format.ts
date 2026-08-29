import type { RangeKey } from "./types";

export function compactNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 10_000) return `${sign}${Math.round(abs / 1000)}k`;
  if (abs >= 1_000) return `${sign}${(abs / 1000).toFixed(1)}k`;
  return `${sign}${Math.round(abs).toLocaleString("en-US")}`;
}

export function signedNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const body = compactNumber(Math.abs(n));
  if (n > 0) return `+${body}`;
  if (n < 0) return `−${body}`;
  return body;
}

export function pct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(digits)}%`;
}

export function parseCount(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function rangeLabel(range: RangeKey): string {
  if (range === "today") return "24h";
  if (range === "7d") return "7d";
  return "30d";
}

export function rangeLong(range: RangeKey): string {
  if (range === "today") return "today";
  if (range === "7d") return "this week";
  return "this month";
}

export function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(d);
}

export function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(iso: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, (now - t) / 86_400_000);
}

export function cls(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
