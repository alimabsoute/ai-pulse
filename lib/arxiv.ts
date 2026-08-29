import type { Paper, SourceStatus } from "./types";
import { fetchText } from "./http";

function tag(xml: string, name: string): string | null {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : null;
}

function allTags(xml: string, name: string): string[] {
  const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "g");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    out.push(m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim());
  }
  return out;
}

export async function loadArxiv(): Promise<{ papers: Paper[]; status: SourceStatus }> {
  const url =
    "http://export.arxiv.org/api/query?search_query=cat:cs.AI&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending";
  const res = await fetchText(url, {
    headers: { Accept: "application/atom+xml,application/xml,text/xml" },
  });
  if (!res.ok) {
    return {
      papers: [],
      status: { id: "arxiv", ok: false, status: res.status, error: res.error, count: 0 },
    };
  }
  const chunks = res.data.split(/<entry[\s>]/).slice(1);
  const papers: Paper[] = [];
  for (const chunk of chunks) {
    const id = tag(chunk, "id");
    const title = tag(chunk, "title")?.replace(/\s+/g, " ");
    if (!id || !title) continue;
    const published = tag(chunk, "published") ?? "";
    const summary = (tag(chunk, "summary") ?? "").replace(/\s+/g, " ").slice(0, 280);
    const authors = allTags(chunk, "name").slice(0, 6);
    papers.push({
      id,
      title,
      url: id,
      summary,
      published,
      authors,
    });
  }
  return {
    papers,
    status: { id: "arxiv", ok: true, status: res.status, count: papers.length },
  };
}
