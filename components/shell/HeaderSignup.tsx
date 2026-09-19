"use client";

import { FormEvent, useId, useRef, useState } from "react";

type Status = "idle" | "pending" | "success" | "error";

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// The header has a backdrop-filter, which would clip a fixed child to the
// header box — so the canvas lives on <body> for the length of the burst.
function fireConfetti(originX: number, originY: number) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { innerWidth: w, innerHeight: h } = window;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = `position:fixed;inset:0;width:${w}px;height:${h}px;pointer-events:none;z-index:60`;
  ctx.scale(dpr, dpr);
  document.body.appendChild(canvas);

  const colors = ["#f0a202", "#ffc44d", "#f3ead8", "#3ddc97", "#ff5c5c"];
  const pieces = Array.from({ length: 90 }, () => ({
    x: originX + (Math.random() - 0.5) * 60,
    y: originY,
    vx: (Math.random() - 0.65) * 13,
    vy: Math.random() * -7 - 1,
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
      canvas.remove();
    }
  };

  requestAnimationFrame(tick);
}

export function HeaderSignup() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputId = useId();
  const errorId = useId();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "pending") return;

    const trimmed = email.trim().toLowerCase();
    if (!isEmail(trimmed)) {
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
          source: "pulse-header",
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

      const rect = formRef.current?.getBoundingClientRect();
      setStatus("success");
      setEmail("");
      if (rect && !prefersReducedMotion()) {
        fireConfetti(rect.left + rect.width / 2, rect.bottom);
      }
    } catch {
      setStatus("error");
      setMessage("Network blip — try again.");
    }
  }

  if (status === "success") {
    return (
      <p
        role="status"
        className="reveal flex h-[46px] shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-gold md:h-9"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" />
        </svg>
        On the list
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      aria-label="Email signup"
      className="relative shrink-0"
    >
      <div
        className={
          "flex h-[46px] w-[clamp(9rem,46vw,13rem)] items-stretch rounded-sm border bg-ink/60 transition-colors focus-within:border-gold/60 md:h-9 md:w-60 " +
          (status === "error" ? "border-rose/60" : "border-line-2")
        }
      >
        <label htmlFor={inputId} className="sr-only">
          Email for Pulse updates
        </label>
        <input
          id={inputId}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          aria-invalid={status === "error"}
          aria-describedby={message ? errorId : undefined}
          onChange={(ev) => {
            setEmail(ev.target.value);
            if (status === "error") {
              setStatus("idle");
              setMessage(null);
            }
          }}
          placeholder="Your email"
          className="min-w-0 flex-1 bg-transparent px-2.5 text-base text-paper outline-none placeholder:text-mute/70 md:text-[13px]"
        />
        <button
          type="submit"
          disabled={status === "pending"}
          className="min-w-11 shrink-0 rounded-r-[1px] bg-gold px-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-2 disabled:cursor-wait disabled:opacity-70"
        >
          {status === "pending" ? "…" : "Join"}
        </button>
      </div>

      {message ? (
        <p
          id={errorId}
          role="alert"
          className="reveal absolute right-0 top-full mt-1.5 whitespace-nowrap rounded-sm border border-rose/40 bg-ink px-2 py-1 font-mono text-[11px] text-rose shadow-lg"
        >
          {message}
        </p>
      ) : null}

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
  );
}
