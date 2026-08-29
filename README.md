# Pulse

A public, mobile-first web app that **quantifies** trending technology — GitHub repositories first, with a heavy AI/ML/LLM/agents bias — plus Hugging Face models, datasets, spaces, and the latest arXiv cs.AI papers.

Bloomberg-terminal energy, editorial magazine type. Numbers are the main characters. Pulse **never invents statistics**. If a source fails or a metric cannot be computed, it is omitted and the UI says so.

## What you get

- **Hero of the moment** — hottest repo / biggest mover, with stars, window velocity, % change, and heat (0-100).
- **Trending GitHub repos** — name, description, language, stars, forks, star velocity, sparkline, topics/signals, heat. Tap for a detail sheet (bottom sheet on mobile, side panel on desktop).
- **AI radar** — Hugging Face models / datasets / spaces and arXiv cs.AI.
- **Charts** — ranked heat bars, velocity area (daily star rate across 30d / 7d / 1d windows), language mix, movers board (absolute and percent).
- **Filters** — today / 7d / 30d, topic chips, language chips.
- **PWA** — installable, `manifest.webmanifest`, theme color, apple-mobile-web-app-capable, offline shell service worker, safe-area insets.

## Data sources (real, public, no key required)

| Source | How |
| --- | --- |
| [GitHub Trending](https://github.com/trending) | HTML parsed server-side for daily / weekly / monthly (stars, forks, language, "stars today/this week/this month"). |
| [GitHub Search API](https://api.github.com/search/repositories) | Unauthenticated `topic:ai created:>YYYY-MM-DD` (GitHub Search 422s if you OR multiple topic qualifiers). Optional `GITHUB_TOKEN` raises the rate limit. |
| [Hugging Face API](https://huggingface.co/api/models) | Models, datasets, spaces sorted by likes. Downloads/likes when present. |
| [arXiv API](http://export.arxiv.org/api/query) | Latest `cat:cs.AI` submissions. |

Requests use Next.js `fetch` with a 10-minute revalidate window and `unstable_cache`. HTTP 403 / 429 are treated as rate limits; the UI shows a degraded banner instead of fake numbers. The client also refreshes the route every 10 minutes.

### Heat score

```
logNorm(x, cap) = min(1, log10(1+x) / log10(1+cap))
recency         = max(0, 1 - daysSincePush / 45)

weights: stars 0.30 · velocity 0.45 · recency 0.15 · AI-signal 0.10
heat    = round(100 * sum(w_i * c_i) / sum(w_i for present terms))
```

Missing terms (no velocity, no push date) are dropped and remaining weights renormalize. Hugging Face heat uses likes (0.55) + downloads (0.45). See `/about` and `lib/heat.ts`.

Percent change is `starsAdded / max(1, stars - starsAdded)` when trending reports a window figure. Sparklines use **observed** daily rates from the windows a repo actually appeared in — no interpolated days.

## Run

```bash
cd ai-pulse
npm install
npm run dev     # http://localhost:3000
npm run build
npm start
```

Node 20+ recommended. Deploy on Vercel as a standard Next.js app (no custom server).

## Optional environment

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | GitHub personal access token. Not required. Without it the Search API is limited. Trending HTML still works. |

Create `.env.local`:

```
GITHUB_TOKEN=ghp_your_token_here
```

## Routes

| Path | |
| --- | --- |
| `/` | Home — story, charts, feed |
| `/repos` | Full trending list |
| `/ai` | Hugging Face + arXiv |
| `/movers` | Absolute and percent movers |
| `/about` | Method note |

Query params: `range=today|7d|30d`, `topic=`, `language=`, `repo=owner/name` (opens detail).

## Stack

Next.js App Router (16) · TypeScript · Tailwind CSS v4 · Recharts · Cheerio (trending HTML).
