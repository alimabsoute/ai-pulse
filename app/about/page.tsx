import type { Metadata } from "next";
import { SectionHead } from "@/components/ui/Meta";
import Link from "next/link";

export const metadata: Metadata = { title: "Method" };

export default function AboutPage() {
  return (
    <article className="flex max-w-2xl flex-col gap-6">
      <SectionHead kicker="Method" title="How Pulse scores the tape" />
      <p className="text-base leading-relaxed text-paper-dim">
        Pulse is a public dashboard for trending GitHub repositories and the AI stack. Every number
        on screen is observed from a public source or derived from those observations. If a source
        fails or a metric cannot be computed, it is omitted — never invented.
      </p>

      <section className="border border-line bg-panel p-4 md:p-6">
        <h3 className="font-display text-2xl text-paper">Heat score (0–100)</h3>
        <p className="mt-2 text-sm leading-relaxed text-paper-dim">
          Let <span className="font-mono text-gold">logNorm(x, cap) = min(1, log10(1+x) / log10(1+cap))</span>
          . Recency is <span className="font-mono text-gold">max(0, 1 − daysSincePush / 45)</span>.
        </p>
        <ul className="mt-3 space-y-2 font-mono text-xs text-paper-dim">
          <li>stars 0.30 — logNorm(stargazers, 80,000)</li>
          <li>velocity 0.45 — logNorm(stars added in the selected window, 4,000)</li>
          <li>recency 0.15 — days since last push (GitHub Search only)</li>
          <li>signal 0.10 — AI keyword hits in name, description, and topics</li>
        </ul>
        <p className="mt-3 text-sm text-paper-dim">
          Missing terms are dropped and remaining weights renormalize. Hugging Face items use likes
          (0.55) and downloads (0.45) with the same log curve.
        </p>
      </section>

      <section>
        <h3 className="font-display text-2xl text-paper">Sources</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-paper-dim">
          <li>
            GitHub Trending HTML (daily / weekly / monthly) — stars, forks, language, and window
            velocity (“stars today / this week / this month”).
          </li>
          <li>
            GitHub Search API (unauthenticated, optional <span className="font-mono">GITHUB_TOKEN</span>) —
            AI/LLM/ML topics, created-date filter, topics, timestamps.
          </li>
          <li>Hugging Face public API — models, datasets, spaces sorted by likes.</li>
          <li>arXiv Atom API — latest cs.AI submissions.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-display text-2xl text-paper">Derived metrics</h3>
        <p className="mt-2 text-sm leading-relaxed text-paper-dim">
          Percent change is starsAdded / max(1, stars − starsAdded). Daily star rate for sparklines
          is starsAdded / windowDays for each window a repo actually appeared in. We do not
          interpolate missing days.
        </p>
      </section>

      <section>
        <h3 className="font-display text-2xl text-paper">Refresh</h3>
        <p className="mt-2 text-sm leading-relaxed text-paper-dim">
          Server fetches are cached for 10 minutes (Next.js fetch cache + unstable_cache). The
          client also calls router.refresh on that cadence. 403 and 429 responses are treated as
          rate limits and surface as a degraded banner.
        </p>
      </section>

      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
        <Link href="/" className="text-gold">
          Back to the tape
        </Link>
      </p>
    </article>
  );
}
