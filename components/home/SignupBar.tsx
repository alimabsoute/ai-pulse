"use client";

import { FormEvent, useId, useRef, useState } from "react";

type Status = "idle" | "pending" | "success" | "error";

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function fireConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { innerWidth: w, innerHeight: h } = window;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.scale(dpr, dpr);

  const colors = ["#f0a202", "#ffc44d", "#f3ead8", "#3ddc97", "#ff5c5c"];
  const pieces = Array.from({ length: 120 }, () => ({
    x: w * 0.5 + (Math.random() - 0.5) * 80,
    y: h * 0.18,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -11 - 4,
    g: 0.22 + Math.random() * 0.12,
    w: 4 + Math.random() * 5,
    h: 6 + Math.random() * 8,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.35,
    color: colors[Math.floor(Math.random() * colors.length)]!,
    life: 0,
  }));

  let frame = 0;
  const max = 90;

  const tick = () => {
    frame += 1;
    ctx.clearRect(0, 0, w, h);
    for (const p of pieces) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life += 1;
      const alpha = Math.max(0, 1 - p.life / max);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (frame < max) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  };

  requestAnimationFrame(tick);
}

export function SignupBar() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputId = useId();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "pending") return;

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || trimmed.endsWith("@")) {
      setStatus("error");
      setMessage("Enter a real email.");
      return;
    }

    setStatus("pending");
    setMessage(null);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: "pulse-home",
          company,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(
          data.error === "not_configured"
            ? "Signup is warming up — try again soon."
            : "Couldn’t save that. Try again.",
        );
        return;
      }

      setStatus("success");
      setEmail("");
      if (!prefersReducedMotion() && canvasRef.current) {
        fireConfetti(canvasRef.current);
      }
    } catch {
      setStatus("error");
      setMessage("Network blip — try again.");
    }
  }

  return (
    <section
      aria-label="Email signup"
      className="relative overflow-hidden rounded-sm border border-line bg-panel/80 px-3 py-3 md:px-4 md:py-3.5"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50"
        aria-hidden
      />

      {status === "success" ? (
        <div className="reveal flex flex-col gap-1 md:flex-row md:items-center md:justify-between md:gap-4">
          <div>
            <p className="font-display text-lg text-paper md:text-xl">
              You’re in — we’ll send updates.
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-mute">
              Never spam. Never sell your data.
            </p>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">
            On the list
          </span>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3"
        >
          <div className="min-w-0 flex-1">
            <label
              htmlFor={inputId}
              className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-gold"
            >
              Get the tape
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                id={inputId}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(ev) => {
                  setEmail(ev.target.value);
                  if (status === "error") {
                    setStatus("idle");
                    setMessage(null);
                  }
                }}
                placeholder="you@domain.com"
                className="min-h-11 w-full flex-1 rounded-sm border border-line bg-ink px-3 font-mono text-sm text-paper outline-none placeholder:text-mute/70 focus:border-gold/60"
              />
              <button
                type="submit"
                disabled={status === "pending"}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm bg-gold px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition hover:bg-gold-2 disabled:cursor-wait disabled:opacity-70"
              >
                {status === "pending" ? "Saving…" : "Send me updates"}
              </button>
            </div>
            <p className="mt-1.5 font-mono text-[10px] leading-relaxed tracking-[0.04em] text-mute">
              Occasional updates when the tape moves. We’ll never spam you or sell
              your data.
            </p>
            {message ? (
              <p className="mt-1 font-mono text-[11px] text-rose" role="alert">
                {message}
              </p>
            ) : null}
          </div>

          {/* honeypot */}
          <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden>
            <label>
              Company
              <input
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(ev) => setCompany(ev.target.value)}
              />
            </label>
          </div>
        </form>
      )}
    </section>
  );
}
