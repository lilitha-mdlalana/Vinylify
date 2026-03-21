"use client";

import { usePlaybackDeck } from "@/components/playback-deck-context";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function VinylRecordDeck() {
  const { deck } = usePlaybackDeck();
  const { coverUrl, isPlaying } = deck;

  return (
    <div className="vinyl-player-deck" data-speed="33">
      <div
        id="turntable"
        className={cn(
          isPlaying ? "play" : "pause",
          isPlaying ? "arm-on-record" : "arm-parked"
        )}
      >
        <div className="vinyl-platter">
          <div id="record">
            <div id="record-inner">
              <div id="label">
                {coverUrl ? (
                  <>
                    <Image
                      src={coverUrl}
                      alt=""
                      fill
                      className="vinyl-label-cover object-cover"
                      sizes="(max-width: 1100px) 40vw, 200px"
                    />
                    <span className="sr-only">Album art from Spotify</span>
                  </>
                ) : (
                  <div className="vinyl-label-placeholder" aria-hidden />
                )}
              </div>
            </div>
          </div>
          <div id="shine" aria-hidden />
          <div id="controls">
            <div id="arm">
              <div className="base" />
              <div className="arm">
                <div className="head" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
