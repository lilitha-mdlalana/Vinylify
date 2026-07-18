"use client";

import { usePlaybackDeck } from "@/components/player/playback-deck-context";
import { DeckPlayerPanel } from "@/components/player/deck-player-panel";
import type { MeResponse, SpotifyUserProfile } from "@/types/spotify-profile";
import type { Mixtape, MixtapeSide } from "@/types/mixtape";
import { Loader2, Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/**
 * Auth-gated playback zone for the public share page.
 * Anonymous visitors get the sleeve only; the SDK never mounts.
 */
export function MixtapePlaybackController({
  mixtape,
  activeSide,
}: {
  mixtape: Mixtape;
  activeSide: MixtapeSide;
}) {
  const { spotifyDeviceId } = usePlaybackDeck();
  const [user, setUser] = useState<SpotifyUserProfile | null | undefined>(
    undefined
  );
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: MeResponse) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const playSide = useCallback(async () => {
    if (!spotifyDeviceId) {
      setFeedback("The tape deck is still warming up — try again in a moment.");
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const uris = mixtape.tracks
        .filter((t) => t.side === activeSide)
        .sort((a, b) => a.position - b.position)
        .map((t) => t.uri);
      const res = await fetch("/api/spotify/playback/play", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: spotifyDeviceId, uris }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!res.ok) {
        setFeedback(
          data.message ??
            (res.status === 403
              ? "Playback needs Spotify Premium."
              : "Could not start the tape. Try again.")
        );
      }
    } catch {
      setFeedback("Network error starting playback.");
    } finally {
      setBusy(false);
    }
  }, [spotifyDeviceId, mixtape.tracks, activeSide]);

  if (user === undefined) {
    return <p className="mix-note">Checking the deck…</p>;
  }

  if (user === null) {
    return (
      <div className="flex flex-col items-center gap-3">
        <a
          className="mix-play-cta"
          href={`/api/auth/login?returnTo=${encodeURIComponent(`/m/${mixtape.slug}`)}`}
        >
          Sign in with Spotify to play
        </a>
        <p className="mix-note">Playback requires Spotify Premium</p>
      </div>
    );
  }

  if (user.product && user.product !== "premium") {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="mix-note">
          Web playback needs Spotify Premium — open the songs in Spotify
          instead:
        </p>
        <a
          className="mix-play-cta"
          href={`https://open.spotify.com/playlist/${mixtape.playlistId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Spotify
        </a>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <button
        type="button"
        className="mix-play-cta"
        disabled={busy || !spotifyDeviceId}
        onClick={playSide}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Play className="size-4 fill-current" aria-hidden />
        )}
        Drop the needle — Side {activeSide}
      </button>
      {!spotifyDeviceId && (
        <p className="mix-note">Connecting to Spotify…</p>
      )}
      {feedback && (
        <p className="mix-note" role="status">
          {feedback}
        </p>
      )}
      <DeckPlayerPanel className="w-full max-w-md" />
    </div>
  );
}
