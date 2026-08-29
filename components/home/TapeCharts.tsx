"use client";

import { useState, type ReactNode } from "react";
import { cls } from "@/lib/format";

export function TapeCharts({ tape, charts }: { tape: ReactNode; charts: ReactNode }) {
  const [tab, setTab] = useState<"tape" | "charts">("tape");
  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Tape or charts"
        className="flex gap-2 border-b border-line pb-3"
      >
        <TabButton
          id="tab-tape"
          active={tab === "tape"}
          onClick={() => setTab("tape")}
          label="Tape"
        />
        <TabButton
          id="tab-charts"
          active={tab === "charts"}
          onClick={() => setTab("charts")}
          label="Charts"
        />
      </div>
      <div role="tabpanel" aria-labelledby="tab-tape" hidden={tab !== "tape"}>
        {tab === "tape" ? tape : null}
      </div>
      <div role="tabpanel" aria-labelledby="tab-charts" hidden={tab !== "charts"}>
        {tab === "charts" ? charts : null}
      </div>
    </div>
  );
}

function TabButton({
  id,
  active,
  onClick,
  label,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cls(
        "inline-flex min-h-11 min-w-20 items-center justify-center rounded-full border px-5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors",
        active ? "border-gold bg-gold text-ink" : "border-line-2 bg-panel text-paper-dim",
      )}
    >
      {label}
    </button>
  );
}
