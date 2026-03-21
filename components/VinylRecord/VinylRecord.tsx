"use client";

import { DeckPlayerPanel } from "@/components/deck-player-panel";
import { VinylRecordDeck } from "@/components/VinylRecord/vinyl-record-deck";
import "./VinylRecord.css";

export default function VinylRecord() {
  return (
    <div className="vinyl-player-root frosted-backdrop">
      <VinylRecordDeck />
      <DeckPlayerPanel />
    </div>
  );
}
