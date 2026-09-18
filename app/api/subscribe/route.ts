import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  email?: unknown;
  source?: unknown;
  company?: unknown;
  userAgent?: unknown;
};

function isEmail(value: string) {
  // pragmatic, not RFC-perfect
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // honeypot — bots fill this
  if (typeof body.company === "string" && body.company.trim()) {
    return NextResponse.json({ ok: true });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !isEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const webapp = process.env.PULSE_SIGNUP_WEBAPP_URL?.trim();
  if (!webapp) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const source =
    typeof body.source === "string" && body.source.trim()
      ? body.source.trim().slice(0, 80)
      : "pulse-home";
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 300);

  try {
    const upstream = await fetch(webapp, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source, userAgent }),
      redirect: "follow",
      cache: "no-store",
    });

    const text = await upstream.text();
    let parsed: { ok?: boolean } = {};
    try {
      parsed = JSON.parse(text) as { ok?: boolean };
    } catch {
      // Apps Script sometimes returns empty on redirect edge cases
    }

    if (!upstream.ok || parsed.ok === false) {
      return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
  }
}
