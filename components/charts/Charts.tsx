"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";
import type { Repo } from "@/lib/types";

const GOLD = "#f0a202";
const MUTE = "#8b90a0";
const MINT = "#3ddc97";
const PAPER = "#f3ead8";

function Tip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-line bg-ink px-2.5 py-1.5 font-mono text-[11px] text-paper shadow-xl">
      <div className="mb-0.5 text-mute">{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color ?? GOLD }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString("en-US") : p.value}
        </div>
      ))}
    </div>
  );
}

export function HeatBarChart({ repos }: { repos: Repo[] }) {
  const data = repos.slice(0, 10).map((r) => ({
    name: r.name.length > 16 ? `${r.name.slice(0, 15)}…` : r.name,
    heat: r.heat,
    stars: r.stars,
  }));
  if (!data.length) return null;
  return (
    <div className="h-64 w-full min-w-0 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#232836" />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: MUTE, fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={92}
            tick={{ fill: PAPER, fontSize: 11 }}
          />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(240,162,2,0.08)" }} />
          <Bar dataKey="heat" name="heat" radius={[0, 4, 4, 0]} barSize={14}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.heat >= 80 ? GOLD : d.heat >= 55 ? "#c48902" : "#6b5a2a"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VelocityAreaChart({ repos }: { repos: Repo[] }) {
  const series = repos.filter((r) => r.velocity.length >= 2).slice(0, 5);
  if (!series.length) return null;
  const windows = ["30d", "7d", "1d"] as const;
  const data = windows.map((w) => {
    const row: Record<string, number | string> = { window: w };
    for (const r of series) {
      const pt = r.velocity.find((v) => v.window === w);
      if (pt) row[r.name] = Math.round(pt.dailyRate);
    }
    return row;
  });
  const colors = [GOLD, MINT, "#7aa2ff", "#ff5c5c", "#e0d0a8"];
  return (
    <div className="h-56 w-full min-w-0 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232836" />
          <XAxis dataKey="window" tick={{ fill: MUTE, fontSize: 11 }} />
          <YAxis tick={{ fill: MUTE, fontSize: 11 }} width={40} />
          <Tooltip content={<Tip />} />
          {series.map((r, i) => (
            <Area
              key={r.id}
              type="monotone"
              dataKey={r.name}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.12}
              strokeWidth={2}
              connectNulls
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LanguageChart({
  languages,
}: {
  languages: { name: string; count: number; stars: number }[];
}) {
  const data = languages.slice(0, 8).map((l) => ({
    name: l.name,
    repos: l.count,
    stars: l.stars,
  }));
  if (!data.length) return null;
  return (
    <div className="h-56 w-full min-w-0 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#232836" />
          <XAxis dataKey="name" tick={{ fill: MUTE, fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={40} />
          <YAxis tick={{ fill: MUTE, fontSize: 11 }} width={36} />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(240,162,2,0.08)" }} />
          <Bar dataKey="repos" name="repos" fill={GOLD} radius={[3, 3, 0, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
