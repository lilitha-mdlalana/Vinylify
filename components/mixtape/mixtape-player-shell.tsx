"use client";

import { MixtapePlaybackController } from "@/components/mixtape/mixtape-playback-controller";
import {
  PlaybackDeckProvider,
  usePlaybackDeck,
} from "@/components/player/playback-deck-context";
import { deckSkins } from "@/components/player/skins/registry";
import type { Mixtape, MixtapeSide } from "@/types/mixtape";
import Link from "next/link";
import { useMemo, useState } from "react";
import "./mixtape.css";

function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function MixtapeExperience({ mixtape }: { mixtape: Mixtape }) {
  const { deck, player } = usePlaybackDeck();
  const [activeSide, setActiveSide] = useState<MixtapeSide>("A");

  const sideTracks = useMemo(
    () =>
      mixtape.tracks
        .filter((t) => t.side === activeSide)
        .sort((a, b) => a.position - b.position),
    [mixtape.tracks, activeSide]
  );

  const Deck = deckSkins[mixtape.theme].Deck;

  const rise = (i: number) =>
    ({ "--rise-delay": `${i * 0.1}s` }) as React.CSSProperties;

  return (
    <main className="mix-stage">
      <div className="mix-content">
        <p className="mix-eyebrow mix-rise" style={rise(0)}>
          <span className="mix-eyebrow-mark">✳</span>
          {mixtape.creatorDisplayName
            ? `A mixtape from ${mixtape.creatorDisplayName}`
            : "A Vinylify mixtape"}
        </p>

        <div className="mix-rise" style={rise(1)}>
          <h1 className="mix-title">{mixtape.title}</h1>
          {mixtape.recipientName && (
            <p className="mix-recipient">for {mixtape.recipientName}</p>
          )}
        </div>

        {mixtape.dedication && (
          <p className="mix-dedication mix-rise" style={rise(2)}>
            {mixtape.dedication}
          </p>
        )}

        <div className="mix-rise" style={rise(3)}>
          <Deck
            coverUrl={deck.coverUrl ?? mixtape.coverUrl}
            isPlaying={deck.isPlaying}
            player={player}
            positionMs={deck.positionMs}
            durationMs={deck.durationMs}
            title={mixtape.title}
            sideLabel={`Side ${activeSide}`}
          />
        </div>

        <div className="mix-side-toggle mix-rise" style={rise(4)}>
          {(["A", "B"] as const).map((side) => (
            <button
              key={side}
              type="button"
              aria-pressed={activeSide === side}
              onClick={() => setActiveSide(side)}
            >
              Side {side}
            </button>
          ))}
        </div>

        <div className="mix-rise w-full flex flex-col items-center gap-6" style={rise(5)}>
          <MixtapePlaybackController mixtape={mixtape} activeSide={activeSide} />
        </div>

        <ol className="mix-tracklist mix-rise" style={rise(6)} key={activeSide}>
          {sideTracks.map((t, i) => (
            <li key={t.uri + i}>
              <span className="mix-track-no">{i + 1}</span>
              <span className="mix-track-main">
                <p className="mix-track-title">{t.title}</p>
                <p className="mix-track-artists">{t.artists}</p>
              </span>
              <span className="mix-track-time">
                {formatDuration(t.durationMs)}
              </span>
            </li>
          ))}
        </ol>

        {mixtape.linerNotes && (
          <details className="mix-liner mix-rise" style={rise(7)}>
            <summary>Liner notes</summary>
            <p>{mixtape.linerNotes}</p>
          </details>
        )}
      </div>

      <footer className="mix-footer">
        Pressed on <Link href="/">Vinylify</Link> — turn Spotify playlists into
        mixtapes
      </footer>
    </main>
  );
}

export function MixtapePlayerShell({ mixtape }: { mixtape: Mixtape }) {
  return (
    <PlaybackDeckProvider>
      <MixtapeExperience mixtape={mixtape} />
    </PlaybackDeckProvider>
  );
}
