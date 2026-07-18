"use client";

import type { DeckSkinProps } from "@/components/player/skins/types";
import { VinylRecordDeck } from "@/components/player/vinyl-record/vinyl-record-deck";
import "@/components/player/vinyl-record/vinyl-record.css";
import "@/components/player/vinyl-record/vinyl-turntable.css";
import "./vinyl-skin-embed.css";

/**
 * Standalone vinyl deck for embedding outside /player (e.g. mixtape share
 * pages). Reuses the turntable CSS scope while neutralizing the page-level
 * layout that .vinyl-player-root normally brings.
 */
export function VinylSkinDeck(props: DeckSkinProps) {
  return (
    <div className="vinyl-player-root vinyl-embed">
      <VinylRecordDeck {...props} />
    </div>
  );
}
