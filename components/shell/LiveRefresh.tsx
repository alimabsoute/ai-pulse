"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Soft-refresh RSC payload every 10 minutes so the tape stays live. */
export function LiveRefresh({ intervalMs = 10 * 60 * 1000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), intervalMs);
    return () => window.clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
