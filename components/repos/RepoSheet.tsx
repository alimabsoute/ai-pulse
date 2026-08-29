"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Repo } from "@/lib/types";
import type { RepoMedia } from "@/lib/repo-media";
import { RepoDetail } from "./RepoDetail";
import { MediaStrip } from "./RepoMedia";

export function RepoSheet({
  repo,
  closeHref,
  media,
}: {
  repo: Repo;
  closeHref: string;
  media?: RepoMedia;
}) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(closeHref, { scroll: false });
    };
    window.addEventListener("keydown", onKey);
    const mq = window.matchMedia("(max-width: 767px)");
    const prev = document.body.style.overflow;
    const apply = () => {
      document.body.style.overflow = mq.matches ? "hidden" : prev;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", apply);
      document.body.style.overflow = prev;
    };
  }, [router, closeHref]);

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close detail"
        className="sheet-scrim absolute inset-0"
        onClick={() => router.push(closeHref, { scroll: false })}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="repo-sheet-title"
        className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl border border-line bg-panel p-4 pb-[calc(1.25rem+var(--safe-bottom))]"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-2" aria-hidden />
        <div className="mb-3 flex items-center justify-between">
          <p id="repo-sheet-title" className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
            Repo
          </p>
          <button
            type="button"
            onClick={() => router.push(closeHref, { scroll: false })}
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-line font-mono text-xs text-paper-dim"
          >
            Close
          </button>
        </div>
        {media ? <MediaStrip media={media} /> : null}
        <RepoDetail repo={repo} />
      </div>
    </div>
  );
}
