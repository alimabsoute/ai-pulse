import type { Filters, Snapshot } from "@/lib/types";
import { queryString, TOPIC_CHIPS } from "@/lib/pulse";
import { FilterDisclosure, type FilterGroup, type FilterOption } from "./FilterDisclosure";

const RANGES: Array<{ id: Filters["range"]; label: string; short?: string }> = [
  { id: "today", label: "Today", short: "24h" },
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
  const ranges: FilterOption[] = RANGES.map((r) => ({
    id: r.id,
    label: r.label,
    short: r.short,
    href: `${basePath}${queryString(filters, { range: r.id })}`,
    active: filters.range === r.id,
  }));

  const groups: FilterGroup[] = [
    {
      id: "topic",
      label: "Topic",
      value: filters.topic === "all" ? "All" : filters.topic,
      filtered: filters.topic !== "all",
      options: TOPIC_CHIPS.map((t) => ({
        id: t,
        label: t === "all" ? "All topics" : t,
        href: `${basePath}${queryString(filters, { topic: t })}`,
        active: filters.topic === t,
      })),
    },
  ];

  const langs = snapshot.languages.slice(0, 8);
  if (langs.length > 0) {
    groups.push({
      id: "language",
      label: "Lang",
      value: filters.language === "all" ? "All" : filters.language,
      filtered: filters.language !== "all",
      options: [
        {
          id: "all",
          label: "All langs",
          href: `${basePath}${queryString(filters, { language: "all" })}`,
          active: filters.language === "all",
        },
        ...langs.map((l) => ({
          id: l.name,
          label: l.name,
          count: l.count,
          href: `${basePath}${queryString(filters, { language: l.name })}`,
          active: filters.language === l.name,
        })),
      ],
    });
  }

  const dirty =
    filters.range !== "today" || filters.topic !== "all" || filters.language !== "all";

  return (
    <FilterDisclosure ranges={ranges} groups={groups} resetHref={dirty ? basePath : null} />
  );
}
