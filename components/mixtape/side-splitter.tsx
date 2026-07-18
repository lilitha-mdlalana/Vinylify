"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MixtapeSide } from "@/types/mixtape";
import { ArrowLeftRight } from "lucide-react";

export type SplitterTrack = {
  uri: string;
  title: string;
  artists: string;
  durationMs: number;
  imageUrl: string | null;
};

function formatDuration(totalMs: number) {
  const s = Math.round(totalMs / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

function formatSideTotal(totalMs: number) {
  const min = Math.round(totalMs / 60000);
  return `${min} min`;
}

/**
 * Balanced split by cumulative duration — the point where side A's runtime is
 * closest to half the total, like fitting a C90.
 */
export function balancedSplit(tracks: { durationMs: number }[]): MixtapeSide[] {
  const total = tracks.reduce((sum, t) => sum + t.durationMs, 0);
  let best = 0;
  let bestDiff = Infinity;
  let running = 0;
  for (let i = 0; i < tracks.length; i++) {
    running += tracks[i].durationMs;
    const diff = Math.abs(running - total / 2);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return tracks.map((_, i) => (i <= best ? "A" : "B"));
}

function SideColumn({
  side,
  tracks,
  indices,
  onToggle,
}: {
  side: MixtapeSide;
  tracks: SplitterTrack[];
  indices: number[];
  onToggle: (index: number) => void;
}) {
  const totalMs = indices.reduce((sum, i) => sum + tracks[i].durationMs, 0);
  return (
    <div className="bg-card/80 min-w-0 flex-1 rounded-2xl p-4 ring-1 ring-foreground/10">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-heading text-lg font-semibold">
          Side {side}
          <span className="ml-2 align-middle text-xs font-normal text-muted-foreground">
            {indices.length} tracks · {formatSideTotal(totalMs)}
          </span>
        </h3>
      </div>
      {indices.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          No tracks on this side yet.
        </p>
      ) : (
        <ol className="flex flex-col gap-1">
          {indices.map((i) => (
            <li
              key={tracks[i].uri + i}
              className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-foreground/5"
            >
              <span className="text-muted-foreground w-5 shrink-0 text-right text-xs tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{tracks[i].title}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {tracks[i].artists}
                </p>
              </div>
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {formatDuration(tracks[i].durationMs)}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7 shrink-0 opacity-40 transition-opacity group-hover:opacity-100"
                onClick={() => onToggle(i)}
                aria-label={`Move to side ${side === "A" ? "B" : "A"}`}
              >
                <ArrowLeftRight className="size-3.5" aria-hidden />
              </Button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function SideSplitter({
  tracks,
  assignments,
  onChange,
  className,
}: {
  tracks: SplitterTrack[];
  assignments: MixtapeSide[];
  onChange: (next: MixtapeSide[]) => void;
  className?: string;
}) {
  const sideA = assignments
    .map((s, i) => (s === "A" ? i : -1))
    .filter((i) => i >= 0);
  const sideB = assignments
    .map((s, i) => (s === "B" ? i : -1))
    .filter((i) => i >= 0);

  const toggle = (index: number) => {
    const next = [...assignments];
    next[index] = next[index] === "A" ? "B" : "A";
    onChange(next);
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Tracks keep their playlist order — move them between sides like
          winding a real tape.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onChange(balancedSplit(tracks))}
        >
          Auto-split
        </Button>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <SideColumn side="A" tracks={tracks} indices={sideA} onToggle={toggle} />
        <SideColumn side="B" tracks={tracks} indices={sideB} onToggle={toggle} />
      </div>
    </div>
  );
}
