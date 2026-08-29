"use client";

import type { ReactNode } from "react";
import type { RepoMedia, RepoStill } from "@/lib/repo-media";
import { SafeImg } from "@/components/media/SafeImg";

export function MediaCanvas({ media }: { media: RepoMedia }) {
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <LooksLike media={media} />
      <ClipsBlock media={media} />
      <TalksBlock media={media} />
    </div>
  );
}

export function MediaStrip({ media }: { media: RepoMedia }) {
  const tiles: Array<{ key: string; node: ReactNode }> = [];
  tiles.push({
    key: "og",
    node: (
      <SafeImg
        src={media.ogImage}
        alt={`${media.fullName} social preview`}
        className="h-28 w-[11.5rem] object-cover"
      />
    ),
  });
  for (const still of media.stills.slice(0, 8)) {
    tiles.push({
      key: still.src,
      node: <StillFrame still={still} className="h-28 w-[11.5rem] object-cover" />,
    });
  }
  for (const clip of media.clips.slice(0, 2)) {
    tiles.push({
      key: clip.id,
      node: (
        <iframe
          src={clip.embedUrl}
          title={clip.title}
          className="h-28 w-[12.5rem] border-0 bg-ink"
          allow="encrypted-media; picture-in-picture"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ),
    });
  }
  if (tiles.length <= 1 && media.stills.length === 0) {
    return (
      <p className="mb-4 font-mono text-[11px] text-mute">No readme screenshots yet</p>
    );
  }
  return (
    <div className="media-strip mb-4">
      {tiles.map((t) => (
        <div
          key={t.key}
          className="overflow-hidden border border-line bg-ink-2"
        >
          {t.node}
        </div>
      ))}
    </div>
  );
}

function LooksLike({ media }: { media: RepoMedia }) {
  return (
    <section>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
        What it looks like
      </p>
      <div className="mt-3 overflow-hidden border border-line bg-ink-2">
        <SafeImg
          src={media.ogImage}
          alt={`${media.fullName} social preview`}
          className="aspect-[1.91/1] w-full object-cover"
        />
      </div>
      {media.stills.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {media.stills.map((still) => (
            <div key={still.src} className="overflow-hidden border border-line bg-ink-2">
              <StillFrame still={still} className="aspect-video w-full object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 font-mono text-[11px] text-mute">No readme screenshots yet</p>
      )}
    </section>
  );
}

function ClipsBlock({ media }: { media: RepoMedia }) {
  return (
    <section>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
        Videos of what it&apos;s doing
      </p>
      {media.clips.length ? (
        <div className="mt-3 grid gap-3">
          {media.clips.map((clip) => (
            <div key={clip.id} className="border border-line bg-ink-2">
              <iframe
                src={clip.embedUrl}
                title={clip.title}
                className="aspect-video w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
              <p className="px-3 py-2 font-mono text-[11px] text-paper-dim">{clip.title}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-mute">
          No public videos turned up.{" "}
          <a
            href={media.youtubeSearchUrl}
            target="_blank"
            rel="noreferrer"
            className="text-gold underline decoration-gold/40 underline-offset-4"
          >
            Search YouTube
          </a>
        </p>
      )}
    </section>
  );
}

function TalksBlock({ media }: { media: RepoMedia }) {
  return (
    <section>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
        Why it&apos;s moving
      </p>
      {media.talks.length ? (
        <ul className="mt-3 border border-line bg-panel">
          {media.talks.map((talk) => (
            <li key={talk.url} className="border-b border-line last:border-0">
              <a
                href={talk.url}
                target="_blank"
                rel="noreferrer"
                className="block min-h-11 px-3 py-3 transition-colors hover:bg-ink-2"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                  {talk.source === "x" ? "X" : talk.source === "hn" ? "HN" : "Reddit"}
                </span>
                <p className="mt-1 text-sm leading-snug text-paper">{talk.title}</p>
                {talk.body ? (
                  <p className="mt-1 line-clamp-2 text-xs text-paper-dim">{talk.body}</p>
                ) : null}
                {talk.author || talk.points != null ? (
                  <p className="mt-1 font-mono text-[10px] text-mute">
                    {[talk.author, talk.points != null ? String(talk.points) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-mute">
          No public conversation pulled yet.{" "}
          <a
            href={media.xSearchUrl}
            target="_blank"
            rel="noreferrer"
            className="text-gold underline decoration-gold/40 underline-offset-4"
          >
            Search X
          </a>
        </p>
      )}
    </section>
  );
}

function StillFrame({ still, className }: { still: RepoStill; className?: string }) {
  if (still.kind === "video") {
    return (
      <video
        src={still.src}
        className={className}
        muted
        playsInline
        controls
        preload="metadata"
      />
    );
  }
  return <SafeImg src={still.src} alt={still.alt} className={className} />;
}
