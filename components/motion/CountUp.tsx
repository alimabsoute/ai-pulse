"use client";

import { useEffect, useState } from "react";
import { compactNumber, pct, signedNumber } from "@/lib/format";

export type CountKind = "compact" | "signed" | "pct" | "int";

function formatKind(kind: CountKind, n: number): string {
  switch (kind) {
    case "compact":
      return compactNumber(n);
    case "signed":
      return signedNumber(n);
    case "pct":
      return pct(n);
    case "int":
      return String(Math.round(n));
  }
}

export function CountUp({
  value,
  kind,
  duration = 800,
  delay = 0,
  className,
}: {
  value: number | null | undefined;
  kind: CountKind;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const empty = value === null || value === undefined || Number.isNaN(value);
  const [text, setText] = useState(() => (empty ? "—" : formatKind(kind, 0)));

  useEffect(() => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      setText("—");
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setText(formatKind(kind, value));
      return;
    }

    let raf = 0;
    let startAt = 0;
    const dur = Math.min(900, Math.max(600, duration));
    const to = value;
    const easeOut = (t: number) => 1 - (1 - t) ** 3;

    const start = () => {
      startAt = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - startAt) / dur);
        setText(formatKind(kind, to * easeOut(t)));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const wait = window.setTimeout(start, delay);
    return () => {
      window.clearTimeout(wait);
      cancelAnimationFrame(raf);
    };
  }, [value, kind, duration, delay]);

  return <span className={`tabular ${className ?? ""}`}>{text}</span>;
}
