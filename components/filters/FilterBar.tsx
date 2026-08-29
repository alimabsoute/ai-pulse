import Link from "next/link";
import type { Filters, Snapshot } from "@/lib/types";
import { queryString, TOPIC_CHIPS } from "@/lib/pulse";
import { cls } from "@/lib/format";

const RANGES: Array<{ id: Filters["range"]; label: string }> = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
];

export function FilterBar({
  filters,
  snapshot,
  basePath = "/",
}: {
  filters: Filters;
  snapshot: Snapshot;
  basePath?: string;
}) {
  const langs = snapshot.languages.slice(0, 8);
  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {RANGES.map((r) => (
          <Chip
            key={r.id}
            href={`${basePath}${queryString(filters, { range: r.id })}`}
            active={filters.range === r.id}
            label={r.label}
          />
        ))}
        <span className="mx-1 hidden h-8 w-px bg-line md:block" aria-hidden />
        {TOPIC_CHIPS.map((t) => (
          <Chip
            key={t}
            href={`${basePath}${queryString(filters, { topic: t })}`}
            active={filters.topic === t}
            label={t === "all" ? "All topics" : t}
          />
        ))}
      </div>
      {langs.length > 0 ? (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          <Chip
            href={`${basePath}${queryString(filters, { language: "all" })}`}
            active={filters.language === "all"}
            label="All langs"
          />
          {langs.map((l) => (
            <Chip
              key={l.name}
              href={`${basePath}${queryString(filters, { language: l.name })}`}
              active={filters.language === l.name}
              label={`${l.name} ${l.count}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Chip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cls(
        "inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
        active
          ? "border-gold bg-gold text-ink"
          : "border-line-2 bg-panel text-paper-dim active:border-gold/60",
      )}
    >
      {label}
    </Link>
  );
}
