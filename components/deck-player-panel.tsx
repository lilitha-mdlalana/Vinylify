"use client";

import { usePlaybackDeck } from "@/components/playback-deck-context";
import { cn } from "@/lib/utils";
import {
  MonitorSmartphone,
  Pause,
  Play,
  Repeat,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const ACCENT = "#f08c2d";

const SDK_SCRIPT_ID = "spotify-web-playback-sdk";

const glassPanel =
  "border border-white/25 bg-white/35 shadow-xl backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-neutral-950/40";

function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function albumCoverUrl(track: SpotifyWebPlaybackTrack | null) {
  const images = track?.album?.images;
  if (!images?.length) {
    return null;
  }
  return images[images.length - 1]?.url ?? images[0]?.url ?? null;
}

export function DeckPlayerPanel({ className }: { className?: string }) {
  const { setDeckPlayback, setSpotifyDeviceId } = usePlaybackDeck();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);

  const playerRef = useRef<SpotifyWebPlaybackPlayer | undefined>(undefined);
  const [sdkPlayer, setSdkPlayer] = useState<
    SpotifyWebPlaybackPlayer | undefined
  >(undefined);

  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [currentTrack, setCurrentTrack] =
    useState<SpotifyWebPlaybackTrack | null>(null);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    void fetch("/api/auth/web-playback-token", { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("unauthorized");
        }
        return res.json() as Promise<{ access_token: string }>;
      })
      .then((data) => setAccessToken(data.access_token))
      .catch(() => setTokenError(true));
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    let cancelled = false;
    let instance: SpotifyWebPlaybackPlayer | undefined;

    const initPlayer = () => {
      if (cancelled || !window.Spotify?.Player) {
        return;
      }

      instance = new window.Spotify.Player({
        name: "Vinylify Web Player",
        getOAuthToken: (cb) => {
          void fetch("/api/auth/web-playback-token", {
            credentials: "same-origin",
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { access_token?: string } | null) => {
              if (data?.access_token) {
                cb(data.access_token);
              } else {
                cb(accessToken);
              }
            })
            .catch(() => cb(accessToken));
        },
        volume: 0.5,
      });

      playerRef.current = instance;
      setSdkPlayer(instance);

      instance.addListener("ready", (payload) => {
        const { device_id } = payload as { device_id: string };
        if (!cancelled) {
          setSpotifyDeviceId(device_id);
        }
      });

      instance.addListener("not_ready", () => {
        if (!cancelled) {
          setSpotifyDeviceId(null);
        }
      });

      instance.addListener("player_state_changed", (raw) => {
        const state = raw as SpotifyPlaybackState | null;
        if (cancelled) {
          return;
        }
        if (!state) {
          setCurrentTrack(null);
          setIsPaused(true);
          setPositionMs(0);
          setDurationMs(0);
          setIsActive(false);
          return;
        }

        const next = state.track_window.current_track;
        setCurrentTrack(next);
        setIsPaused(state.paused);
        setPositionMs(state.position);
        setDurationMs(state.duration);
        setShuffleOn(state.shuffle);
        setRepeatMode(state.repeat_mode);

        void instance?.getCurrentState().then((s) => {
          if (!cancelled) {
            setIsActive(Boolean(s));
          }
        });
      });

      void instance.connect();
      void instance
        .getVolume()
        .then((v) => {
          if (!cancelled && typeof v === "number") {
            setVolume(v);
          }
        })
        .catch(() => {});
    };

    window.onSpotifyWebPlaybackSDKReady = () => {
      if (!cancelled) {
        initPlayer();
      }
    };

    if (!document.getElementById(SDK_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SDK_SCRIPT_ID;
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    if (window.Spotify) {
      initPlayer();
    }

    return () => {
      cancelled = true;
      setSpotifyDeviceId(null);
      if (instance) {
        try {
          instance.disconnect();
        } catch {
          /* ignore */
        }
      }
      playerRef.current = undefined;
      setSdkPlayer(undefined);
      setIsActive(false);
      delete window.onSpotifyWebPlaybackSDKReady;
    };
  }, [accessToken, setSpotifyDeviceId]);

  useEffect(() => {
    const p = playerRef.current;
    if (!isActive || isPaused || !p) {
      return undefined;
    }
    const id = window.setInterval(() => {
      void p.getCurrentState().then((s) => {
        if (s && !s.paused) {
          setPositionMs(s.position);
          setDurationMs(s.duration);
        }
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isActive, isPaused]);

  const durationSec = durationMs / 1000;
  const positionSec = positionMs / 1000;

  const progress = useMemo(
    () =>
      durationMs > 0 ? Math.min(100, (positionMs / durationMs) * 100) : 0,
    [positionMs, durationMs]
  );

  const onProgressChange = useCallback(
    (pct: number) => {
      if (!sdkPlayer || durationMs <= 0) {
        return;
      }
      const ms = (pct / 100) * durationMs;
      setPositionMs(ms);
      void sdkPlayer.seek(Math.floor(ms));
    },
    [sdkPlayer, durationMs]
  );

  const onVolumeChange = useCallback(
    (v: number) => {
      setVolume(v);
      void sdkPlayer?.setVolume(v);
    },
    [sdkPlayer]
  );

  const transportDisabled = !sdkPlayer || !isActive;

  const artistAlbumLine = useMemo(() => {
    if (!currentTrack) {
      return tokenError || !accessToken
        ? "Sign in with Spotify to use web playback"
        : "Choose this device in Spotify Connect to play here";
    }
    const artists = currentTrack.artists.map((a) => a.name).join(", ");
    const album = currentTrack.album?.name ?? "";
    return album ? `${artists} • ${album}` : artists;
  }, [currentTrack, accessToken, tokenError]);

  const coverUrl = albumCoverUrl(currentTrack);
  const deckIsPlaying = Boolean(
    isActive && currentTrack && !isPaused
  );

  useEffect(() => {
    setDeckPlayback({
      coverUrl,
      isPlaying: deckIsPlaying,
    });
  }, [coverUrl, deckIsPlaying, setDeckPlayback]);

  const cycleRepeat = useCallback(() => {
    if (!sdkPlayer || transportDisabled) {
      return;
    }
    const next = repeatMode === 0 ? 1 : repeatMode === 1 ? 2 : 0;
    void sdkPlayer.setRepeat(next);
  }, [sdkPlayer, transportDisabled, repeatMode]);

  const toggleShuffle = useCallback(() => {
    if (!sdkPlayer || transportDisabled) {
      return;
    }
    void sdkPlayer.setShuffle(!shuffleOn);
  }, [sdkPlayer, transportDisabled, shuffleOn]);

  return (
    <section
      className={cn(
        "vinyl-player-profile flex w-full max-w-md flex-col gap-3 justify-self-center",
        className
      )}
      aria-label="Playback controls"
    >
      <div className={cn("rounded-2xl p-6", glassPanel)}>
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          {currentTrack?.name || "Nothing playing"}
        </h2>
        <p className="mt-1 text-sm font-medium" style={{ color: ACCENT }}>
          {artistAlbumLine}
        </p>

        <div className="mt-8">
          <label className="sr-only" htmlFor="deck-progress">
            Track position
          </label>
          <div className="relative flex h-2 items-center">
            <div
              className="h-0.5 w-full rounded-full bg-neutral-900/20 dark:bg-neutral-700/90"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: ACCENT,
                maxWidth: "100%",
              }}
            />
            <input
              id="deck-progress"
              type="range"
              min={0}
              max={100}
              step={0.25}
              value={progress}
              disabled={transportDisabled || durationMs <= 0}
              onChange={(e) => onProgressChange(Number(e.target.value))}
              className="absolute inset-0 h-8 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              aria-valuemin={0}
              aria-valuemax={Math.ceil(durationSec)}
              aria-valuenow={Math.round(positionSec)}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs tabular-nums text-neutral-600 dark:text-neutral-400">
            <span>{formatTime(positionSec)}</span>
            <span>{formatTime(durationSec)}</span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-5 sm:gap-7">
          <button
            type="button"
            disabled={transportDisabled}
            onClick={toggleShuffle}
            className={cn(
              "rounded-full p-2 transition-opacity hover:opacity-90 disabled:opacity-40",
              shuffleOn
                ? "text-neutral-900 dark:text-white"
                : "text-neutral-600 dark:text-white/70"
            )}
            style={shuffleOn ? { color: ACCENT } : undefined}
            aria-pressed={shuffleOn}
            aria-label={shuffleOn ? "Shuffle on" : "Shuffle off"}
          >
            <Shuffle className="size-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            disabled={transportDisabled}
            onClick={() => void sdkPlayer?.previousTrack()}
            className="rounded-full p-2 text-neutral-800 transition-opacity hover:opacity-90 disabled:opacity-40 dark:text-white"
            aria-label="Previous track"
          >
            <SkipBack className="size-6" strokeWidth={2} />
          </button>
          <button
            type="button"
            disabled={!sdkPlayer}
            onClick={() => void sdkPlayer?.togglePlay()}
            className="flex size-14 shrink-0 items-center justify-center rounded-full text-neutral-950 shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98] disabled:opacity-40"
            style={{ backgroundColor: ACCENT }}
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? (
              <Play
                className="size-7 translate-x-0.5 text-neutral-950"
                strokeWidth={2.5}
              />
            ) : (
              <Pause className="size-7 text-neutral-950" strokeWidth={2.5} />
            )}
          </button>
          <button
            type="button"
            disabled={transportDisabled}
            onClick={() => void sdkPlayer?.nextTrack()}
            className="rounded-full p-2 text-neutral-800 transition-opacity hover:opacity-90 disabled:opacity-40 dark:text-white"
            aria-label="Next track"
          >
            <SkipForward className="size-6" strokeWidth={2} />
          </button>
          <button
            type="button"
            disabled={transportDisabled}
            onClick={cycleRepeat}
            className={cn(
              "rounded-full p-2 transition-opacity hover:opacity-90 disabled:opacity-40",
              repeatMode > 0
                ? "text-neutral-900 dark:text-white"
                : "text-neutral-600 dark:text-white/70"
            )}
            style={repeatMode > 0 ? { color: ACCENT } : undefined}
            aria-label={
              repeatMode === 2
                ? "Repeat one"
                : repeatMode === 1
                  ? "Repeat context"
                  : "Repeat off"
            }
          >
            <Repeat className="size-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className={cn("flex items-center gap-3 rounded-xl px-4 py-3", glassPanel)}>
        <Volume2
          className="size-5 shrink-0"
          style={{ color: ACCENT }}
          aria-hidden
        />
        <label className="sr-only" htmlFor="deck-volume">
          Volume
        </label>
        <div className="relative min-w-0 flex-1 py-1">
          <div
            className="h-1 w-full rounded-full bg-neutral-900/20 dark:bg-neutral-700/90"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-700 dark:bg-neutral-200"
            style={{ width: `${volume * 100}%`, maxWidth: "100%" }}
          />
          <input
            id="deck-volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            disabled={!sdkPlayer}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="absolute inset-0 h-8 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(volume * 100)}
          />
        </div>
        <div className="ml-1 flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="rounded-full p-2 text-neutral-800 transition-opacity hover:opacity-90 dark:text-white"
            aria-label="Connect to a device"
          >
            <MonitorSmartphone className="size-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-neutral-800 transition-opacity hover:opacity-90 dark:text-white"
            aria-label="Share"
          >
            <Share2 className="size-5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </section>
  );
}
