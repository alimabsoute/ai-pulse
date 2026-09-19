"use client";

import { useEffect, useRef, useState } from "react";
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
  // Server-render (and first paint) the real value — never a placeholder 0.
  // The count animation only runs when the value changes after mount
  // (e.g. a filter switch), rolling from the previous number to the new one.
  const [text, setText] = useState(() => (empty ? "—" : formatKind(kind, value)));
  const shown = useRef<number | null>(empty ? null : value);

  useEffect(() => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      shown.current = null;
      setText("—");
      return;
    }
    const from = shown.current;
    const to = value;
    shown.current = to;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || from === null || from === to) {
      setText(formatKind(kind, to));
      return;
    }

    let raf = 0;
    const dur = Math.min(900, Math.max(600, duration));
    const easeOut = (t: number) => 1 - (1 - t) ** 3;

    const start = () => {
      const startAt = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - startAt) / dur);
        setText(formatKind(kind, from + (to - from) * easeOut(t)));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const wait = window.setTimeout(start, delay);
    // rAF is frozen in background tabs — make sure the final value always lands.
    const settle = window.setTimeout(() => {
      cancelAnimationFrame(raf);
      setText(formatKind(kind, to));
    }, delay + dur + 150);
    return () => {
      window.clearTimeout(wait);
      window.clearTimeout(settle);
      cancelAnimationFrame(raf);
    };
  }, [value, kind, duration, delay]);

  return <span className={`tabular ${className ?? ""}`}>{text}</span>;
}
