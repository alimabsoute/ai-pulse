import type { HfItem, Paper } from "@/lib/types";
import { compactNumber } from "@/lib/format";
import { EmptyNote } from "@/components/ui/Meta";

export function RadarList({
  items,
  empty,
}: {
  items: HfItem[];
  empty: string;
}) {
  if (!items.length) return <EmptyNote>{empty}</EmptyNote>;
  return (
    <ul className="divide-y divide-line border border-line bg-panel">
      {items.map((item, i) => (
        <li key={item.id}>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-14 items-start gap-3 px-4 py-3"
          >
            <span className="w-6 pt-0.5 font-mono text-[11px] text-mute">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm text-paper">{item.id}</p>
              <p className="mt-0.5 font-mono text-[11px] text-mute">
                {item.pipeline ?? item.kind}
                {item.likes !== null ? ` · ${compactNumber(item.likes)} likes` : ""}
                {item.downloads !== null ? ` · ${compactNumber(item.downloads)} dl` : ""}
              </p>
            </div>
            <span className="font-mono text-sm tabular text-gold">{item.heat}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function PaperList({ papers }: { papers: Paper[] }) {
  if (!papers.length) {
    return <EmptyNote>arXiv did not return cs.AI papers. Nothing is fabricated.</EmptyNote>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {papers.map((p) => (
        <li key={p.id} className="border border-line bg-panel p-4">
          <a href={p.url} target="_blank" rel="noreferrer" className="block min-h-11">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
              {p.published.slice(0, 10)} · {p.authors.slice(0, 3).join(", ")}
            </p>
            <h3 className="mt-1 font-display text-xl leading-snug text-paper">{p.title}</h3>
            {p.summary ? (
              <p className="mt-2 line-clamp-3 text-sm text-paper-dim">{p.summary}</p>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
