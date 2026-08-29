"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cls } from "@/lib/format";

const ITEMS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/repos", label: "Repos", icon: RepoIcon },
  { href: "/ai", label: "AI", icon: RadarIcon },
  { href: "/movers", label: "Movers", icon: MoveIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cls(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 py-2 font-mono text-[10px] uppercase tracking-[0.16em]",
                  active ? "text-gold" : "text-mute",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon active={active} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={active ? "currentColor" : "currentColor"}
        strokeWidth="1.6"
      />
    </svg>
  );
}

function RepoIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4h10v16H7zM7 8h10M7 16h10"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity={active ? 1 : 0.9}
      />
    </svg>
  );
}

function RadarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 12 18 8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

function MoveIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 18 10 10l4 4 5-8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
