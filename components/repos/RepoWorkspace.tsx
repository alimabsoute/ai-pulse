import Link from "next/link";
import type { Repo } from "@/lib/types";
import { getRepoMedia } from "@/lib/repo-media";
import { RepoDetail } from "./RepoDetail";
import { RepoSheet } from "./RepoSheet";
import { MediaCanvas } from "./RepoMedia";
import { CloseOnEscape } from "./CloseOnEscape";

export async function RepoWorkspace({
  repo,
  closeHref,
}: {
  repo: Repo;
  closeHref: string;
}) {
  const media = await getRepoMedia(repo.owner, repo.name);

  return (
    <>
      <CloseOnEscape href={closeHref} />
      <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(28rem,32rem)] md:items-start md:gap-6">
        <div className="min-w-0">
          <MediaCanvas media={media} />
        </div>
        <aside className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto border border-line bg-panel p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">Repo</p>
            <Link
              href={closeHref}
              scroll={false}
              className="inline-flex min-h-11 min-w-11 items-center justify-center border border-line px-3 font-mono text-xs text-paper-dim hover:border-gold/50 hover:text-gold"
            >
              Close
            </Link>
          </div>
          <RepoDetail repo={repo} />
        </aside>
      </div>
      <div className="md:hidden">
        <RepoSheet repo={repo} closeHref={closeHref} media={media} />
      </div>
    </>
  );
}
