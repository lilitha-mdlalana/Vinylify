"use client";

import type { DeckSkinProps } from "@/components/player/skins/types";
import { cn } from "@/lib/utils";
import "./cassette-deck.css";

function counterDigits(positionMs: number) {
  const s = Math.max(0, Math.floor(positionMs / 1000));
  return String(Math.min(s, 9999)).padStart(4, "0");
}

export function CassetteDeck({
  isPlaying,
  player,
  positionMs = 0,
  durationMs = 0,
  title,
  sideLabel,
}: DeckSkinProps) {
  const progress =
    durationMs > 0 ? Math.min(1, Math.max(0, positionMs / durationMs)) : 0;

  const toggle = () => {
    void player?.togglePlay().catch(() => {});
  };

  return (
    <div className="cassette-skin">
      <div
        className={cn("cassette-body", isPlaying && "playing")}
        style={{ "--tape-progress": progress } as React.CSSProperties}
        role="button"
        tabIndex={0}
        aria-label={isPlaying ? "Pause the tape" : "Play the tape"}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <span className="cassette-screw screw-tl" aria-hidden />
        <span className="cassette-screw screw-tr" aria-hidden />
        <span className="cassette-screw screw-bl" aria-hidden />
        <span className="cassette-screw screw-br" aria-hidden />

        <div className="cassette-label">
          <p className="cassette-label-title">{title || "Untitled tape"}</p>
          <div className="cassette-label-stripe" aria-hidden />
          <p className="cassette-label-side">{sideLabel ?? "Side A"}</p>
        </div>

        <div className="cassette-window" aria-hidden>
          <div className="cassette-spool spool-left">
            <div className="cassette-tape-pack" />
            <div className="cassette-reel" />
          </div>
          <div className="cassette-tape-run" />
          <div className="cassette-spool spool-right">
            <div className="cassette-tape-pack" />
            <div className="cassette-reel" />
          </div>
        </div>

        <div className="cassette-foot" aria-hidden>
          <span className="cassette-hole" />
          <span className="cassette-hole" />
          <span className="cassette-hole hole-wide" />
          <span className="cassette-hole" />
          <span className="cassette-hole" />
        </div>
      </div>

      <p className="cassette-counter" aria-label="Tape counter">
        {counterDigits(positionMs)}
      </p>
    </div>
  );
}
