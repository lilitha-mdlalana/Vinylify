"use client";

import { DeckPlayerPanel } from "@/components/player/deck-player-panel";
import { usePlaybackDeck } from "@/components/player/playback-deck-context";
import { VinylRecordDeck } from "@/components/player/vinyl-record/vinyl-record-deck";
import { getPaletteSync } from "colorthief";
import { useEffect, useState } from "react";
import "./vinyl-record.css";
import "./vinyl-turntable.css";
import "./vinyl-background.css";

async function extractColors(
  url: string
): Promise<[number, number, number][]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `/_next/image?url=${encodeURIComponent(url)}&w=64&q=75`;
    img.onload = () => {
      try {
        const palette = getPaletteSync(img, { colorCount: 4 });
        resolve(palette ? palette.map((c) => c.array()) : []);
      } catch {
        reject(new Error("extraction failed"));
      }
    };
    img.onerror = () => reject(new Error("image load failed"));
  });
}

export default function VinylRecord() {
  const { deck } = usePlaybackDeck();
  const { coverUrl } = deck;

  const [colors, setColors] = useState<[number, number, number][] | null>(null);

  useEffect(() => {
    if (!coverUrl) {
      setColors(null);
      return;
    }
    let cancelled = false;
    extractColors(coverUrl)
      .then((p) => {
        if (!cancelled) setColors(p);
      })
      .catch(() => {
        if (!cancelled) setColors(null);
      });
    return () => {
      cancelled = true;
    };
  }, [coverUrl]);

  const gradientBg = colors
    ? `linear-gradient(135deg, rgb(${colors[0]}) 0%, rgb(${colors[1] ?? colors[0]}) 60%, rgb(${colors[2] ?? [0, 0, 0]}) 100%)`
    : "transparent";

  return (
    <div
      className="vinyl-player-root frosted-backdrop"
      data-has-colors={colors ? "true" : undefined}
    >
      {/* Layer 1: blurred album art */}
      {coverUrl && (
        <div
          aria-hidden
          className="bg-layer bg-layer-art"
          style={{
            backgroundImage: `url(/_next/image?url=${encodeURIComponent(coverUrl)}&w=640&q=75)`,
          }}
        />
      )}

      {/* Layer 2: color gradient from album palette */}
      <div
        aria-hidden
        className="bg-layer bg-layer-gradient"
        style={{
          background: gradientBg,
          opacity: colors ? 0.55 : 0,
        }}
      />

      {/* Layer 3: dark overlay */}
      <div aria-hidden className="bg-layer bg-layer-dark" />

      {/* Layer 4: content — display:contents preserves grid layout */}
      <div style={{ display: "contents" }}>
        <VinylRecordDeck />
        <DeckPlayerPanel />
      </div>
    </div>
  );
}
