"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { cls } from "@/lib/format";

export type FilterOption = {
  id: string;
  label: string;
  href: string;
  active: boolean;
  count?: number;
};

export type FilterGroup = {
  id: string;
  label: string;
  value: string;
  filtered: boolean;
  options: FilterOption[];
};

export function FilterDisclosure({
  ranges,
  groups,
  resetHref,
}: {
  ranges: FilterOption[];
  groups: FilterGroup[];
  resetHref: string | null;
}) {
  // `shown` keeps the last group rendered while the panel animates shut.
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState<string>(groups[0]?.id ?? "");
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const group = groups.find((g) => g.id === shown) ?? groups[0];

  function toggle(id: string) {
    if (open && shown === id) {
      setOpen(false);
    } else {
      setShown(id);
      setOpen(true);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Time range"
          className="flex w-full rounded-sm border border-line-2 bg-panel p-0.5 sm:w-auto"
        >
          {ranges.map((r) => (
            <Link
              key={r.id}
              href={r.href}
              scroll={false}
              aria-current={r.active ? "true" : undefined}
              className={cls(
                "inline-flex min-h-10 flex-1 items-center justify-center rounded-[1px] px-3 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors sm:min-h-8 sm:flex-none",
                r.active ? "bg-gold text-ink" : "text-paper-dim hover:text-gold",
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>

        {groups.map((g) => {
          const expanded = open && shown === g.id;
          return (
            <button
              key={g.id}
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => toggle(g.id)}
              className={cls(
                "inline-flex min-h-11 flex-1 items-center justify-between gap-2 rounded-sm border px-3 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors sm:min-h-9 sm:flex-none sm:justify-start",
                expanded
                  ? "border-gold/60 bg-panel text-paper"
                  : "border-line-2 bg-panel text-paper-dim hover:border-gold/40",
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-mute">{g.label}</span>
                <span className={cls("truncate", g.filtered ? "text-gold" : "text-paper")}>
                  {g.value}
                </span>
              </span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden="true"
                className={cls(
                  "shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  expanded && "rotate-180",
                )}
              >
                <path d="m1.5 3.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
          );
        })}

        {resetHref ? (
          <Link
            href={resetHref}
            scroll={false}
            onClick={() => setOpen(false)}
            className="inline-flex min-h-11 items-center px-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-mute underline-offset-4 transition-colors hover:text-gold hover:underline sm:min-h-9"
          >
            Reset
          </Link>
        ) : null}
      </div>

      <div
        id={panelId}
        inert={!open}
        className={cls(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          {group ? (
            <div
              key={group.id}
              role="group"
              aria-label={group.label}
              className="reveal-list mt-2 flex flex-wrap gap-1 border-l-2 border-gold/50 bg-panel/50 py-1.5 pl-2 pr-1.5"
            >
              {group.options.map((o) => (
                <Link
                  key={o.id}
                  href={o.href}
                  scroll={false}
                  aria-current={o.active ? "true" : undefined}
                  onClick={() => setOpen(false)}
                  className={cls(
                    "inline-flex min-h-11 items-center gap-1.5 rounded-sm border px-3 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors sm:min-h-8 sm:px-2.5",
                    o.active
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-transparent text-paper-dim hover:text-gold",
                  )}
                >
                  {o.label}
                  {o.count != null ? (
                    <span className={cls("tabular", o.active ? "text-gold/70" : "text-mute")}>
                      {o.count}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
