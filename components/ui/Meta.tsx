import type { ReactNode } from "react";
import type { SourceStatus } from "@/lib/types";
import { formatStamp } from "@/lib/format";

export function UpdatedStamp({ iso }: { iso: string }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
      As of {formatStamp(iso)} · revalidates daily
    </p>
  );
}

export function SourceBanner({ sources }: { sources: SourceStatus[] }) {
  const failed = sources.filter((s) => !s.ok);
  const ok = sources.filter((s) => s.ok);
  if (!failed.length) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
        Sources live · {ok.map((s) => `${s.id} ${s.count}`).join(" · ")}
      </p>
    );
  }
  return (
    <div className="border border-rose/40 bg-rose/10 px-3 py-2 font-mono text-[11px] text-paper-dim">
      <span className="text-rose">Degraded.</span>{" "}
      {failed.map((s) => `${s.id} ${s.error ?? s.status}`).join(" · ")}
      {ok.length ? ` · still serving ${ok.map((s) => s.id).join(", ")}` : ""}
      . No numbers are invented.
    </div>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">{children}</p>
  );
}

export function SectionHead({
  kicker,
  title,
  aside,
}: {
  kicker: string;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <header className="mb-4 flex items-end justify-between gap-3">
      <div>
        <Kicker>{kicker}</Kicker>
        <h2 className="mt-1 font-display text-3xl leading-none text-paper md:text-4xl">{title}</h2>
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </header>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-line px-4 py-8 text-sm text-mute">{children}</div>
  );
}
