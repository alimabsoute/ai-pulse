"use client";

import { useState } from "react";

export function SafeImg({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [hide, setHide] = useState(false);
  if (hide) return null;
  return (
    // README / OG / contents hosts vary; native img avoids next/image allowlist misses.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setHide(true)}
    />
  );
}
