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
  /** Shorter label for phones. */
  short?: string;
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

  const cell =
    "items-center font-mono text-[11px] uppercase tracking-[0.04em] transition-colors sm:tracking-[0.12em]";
  const on = "bg-gold/10 text-gold shadow-[inset_0_-2px_0_var(--gold)]";

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-panel/60">
      {/* One toolbar, uniform height: range | topic | lang | reset */}
      <div className="flex h-11 items-stretch divide-x divide-line sm:h-9">
        <div role="group" aria-label="Time range" className="flex shrink-0 items-stretch">
          {ranges.map((r) => (
            <Link
              key={r.id}
              href={r.href}
              scroll={false}
              aria-current={r.active ? "true" : undefined}
              className={cls(
                cell,
                "inline-flex justify-center px-2 sm:px-3",
                r.active ? on : "text-paper-dim hover:bg-panel-2 hover:text-paper",
              )}
            >
              {r.short ? (
                <>
                  <span className="sm:hidden">{r.short}</span>
                  <span className="hidden sm:inline">{r.label}</span>
                </>
              ) : (
                r.label
              )}
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
              aria-label={`${g.label}: ${g.value}`}
              onClick={() => toggle(g.id)}
              className={cls(
                cell,
                "inline-flex min-w-0 flex-auto justify-between gap-1 px-2 sm:flex-none sm:justify-start sm:gap-2 sm:border-r sm:border-line sm:px-3",
                expanded ? "bg-panel-2 text-paper" : "text-paper-dim hover:bg-panel-2",
              )}
            >
              {/* Phones show the label until a filter is set, then just the value. */}
              <span className="flex min-w-0 items-center gap-1 sm:gap-1.5">
                <span className={cls("text-mute", g.filtered && "hidden sm:inline")}>{g.label}</span>
                <span
                  className={cls(
                    "truncate",
                    g.filtered ? "text-gold" : "hidden text-paper sm:inline",
                  )}
                >
                  {g.value}
                </span>
              </span>
              <svg
                width="9"
                height="9"
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden="true"
                className={cls(
                  "shrink-0 text-mute transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  expanded && "rotate-180 text-gold",
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
            className={cls(
              cell,
              "ml-auto hidden border-l border-line px-3 text-mute hover:bg-panel-2 hover:text-gold sm:inline-flex",
            )}
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
              className="reveal-list flex flex-wrap border-t border-line p-1 sm:gap-0.5"
            >
              {group.options.map((o) => (
                <Link
                  key={o.id}
                  href={o.href}
                  scroll={false}
                  aria-current={o.active ? "true" : undefined}
                  onClick={() => setOpen(false)}
                  className={cls(
                    cell,
                    "inline-flex min-h-11 gap-1.5 rounded-[1px] px-3 sm:min-h-7 sm:px-2.5",
                    o.active
                      ? "bg-gold/10 text-gold"
                      : "text-paper-dim hover:bg-panel-2 hover:text-paper",
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
              {resetHref ? (
                <Link
                  href={resetHref}
                  scroll={false}
                  onClick={() => setOpen(false)}
                  className={cls(
                    cell,
                    "ml-auto inline-flex min-h-11 px-3 text-mute underline underline-offset-4 sm:hidden",
                  )}
                >
                  Reset all
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
