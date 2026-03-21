"use client";

import { usePlaybackDeck } from "@/components/playback-deck-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Disc3,
  ExternalLink,
  Loader2,
  Play,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type PlaylistRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  owner: string | null;
};

type AlbumRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  artists: string;
  trackCount: number;
};

const accentClass = "text-[#ea580c]";

function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  onAction,
}: {
  eyebrow: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className={cn("mb-1 text-[0.65rem] font-semibold tracking-[0.2em]", accentClass)}>
          {eyebrow}
        </p>
        <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight">
          {title}
        </h2>
      </div>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            "flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-80",
            accentClass
          )}
        >
          {actionLabel}
          <ChevronRight className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function AlbumRailItem({
  album,
  onPlay,
  playingId,
}: {
  album: AlbumRow;
  onPlay: (id: string) => void;
  playingId: string | null;
}) {
  const busy = playingId === album.id;
  return (
    <div className="w-[min(42vw,11rem)] shrink-0 snap-start sm:w-44">
      <div className="group relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/10">
        {album.imageUrl ? (
          <Image
            src={album.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="176px"
            unoptimized
          />
        ) : (
          <div className="bg-muted flex size-full items-center justify-center">
            <Disc3 className="text-muted-foreground size-10" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-12 rounded-full bg-[#ea580c] text-zinc-950 shadow-lg hover:bg-[#f97316]"
            disabled={busy}
            onClick={() => onPlay(album.id)}
            aria-label={`Play ${album.name}`}
          >
            {busy ? (
              <Loader2 className="size-6 animate-spin" aria-hidden />
            ) : (
              <Play className="size-6 translate-x-0.5 fill-current" aria-hidden />
            )}
          </Button>
        </div>
      </div>
      <p className="text-foreground mt-3 line-clamp-2 text-sm font-semibold leading-tight">
        {album.name}
      </p>
      <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
        {album.artists}
      </p>
      <a
        href={`https://open.spotify.com/album/${album.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "mt-2 inline-flex items-center gap-1 text-xs font-medium opacity-80 hover:opacity-100",
          accentClass
        )}
      >
        Open in Spotify
        <ExternalLink className="size-3" aria-hidden />
      </a>
    </div>
  );
}

function PlaylistCrateCard({
  playlist,
  onPlay,
  playingId,
}: {
  playlist: PlaylistRow;
  onPlay: (id: string) => void;
  playingId: string | null;
}) {
  const busy = playingId === playlist.id;
  const subtitle = [
    playlist.trackCount ? `${playlist.trackCount} tracks` : null,
    playlist.owner,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="bg-card/80 hover:bg-card/95 flex items-stretch gap-4 rounded-2xl p-4 ring-1 ring-foreground/10 transition-colors">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24">
        {playlist.imageUrl ? (
          <Image
            src={playlist.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="96px"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Disc3 className="text-muted-foreground size-8" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <h3 className="text-foreground line-clamp-2 font-heading text-lg font-semibold leading-snug">
          {playlist.name}
        </h3>
        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
          {subtitle || "Playlist"}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-[#ea580c] text-zinc-950 hover:bg-[#f97316]"
            disabled={busy}
            onClick={() => onPlay(playlist.id)}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Play className="mr-1 size-4 fill-current" aria-hidden />
            )}
            Play
          </Button>
          <a
            href={`https://open.spotify.com/playlist/${playlist.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "inline-flex"
            )}
          >
            <ExternalLink className="mr-1 size-3.5" aria-hidden />
            Spotify
          </a>
        </div>
      </div>
      <ChevronRight className="text-muted-foreground mt-1 size-5 shrink-0 self-center opacity-50" aria-hidden />
    </div>
  );
}

export function ExploreLibrary({ className }: { className?: string }) {
  const router = useRouter();
  const { spotifyDeviceId } = usePlaybackDeck();

  const [playlists, setPlaylists] = useState<PlaylistRow[] | null>(null);
  const [albums, setAlbums] = useState<AlbumRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const albumsRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/spotify/library/playlists").then((r) => r.json()),
      fetch("/api/spotify/library/albums").then((r) => r.json()),
    ])
      .then(([pl, al]) => {
        if (cancelled) return;
        if (pl.error) {
          setError("Could not load playlists. Try signing in again.");
          setPlaylists([]);
          setAlbums([]);
          return;
        }
        if (al.error) {
          setError("Could not load albums. Try signing in again.");
          setPlaylists(pl.playlists ?? []);
          setAlbums([]);
          return;
        }
        setPlaylists(pl.playlists ?? []);
        setAlbums(al.albums ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Something went wrong loading your library.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const startPlayback = useCallback(
    async (contextUri: string, itemId: string) => {
      setFeedback(null);
      if (!spotifyDeviceId) {
        setFeedback(
          "Open the Turntable tab and wait until Vinylify Web Player is ready in Spotify, then try again."
        );
        return;
      }
      setPlayingId(itemId);
      try {
        const res = await fetch("/api/spotify/playback/play", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId: spotifyDeviceId,
            contextUri,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        if (!res.ok) {
          setFeedback(
            data.message ??
              (res.status === 403
                ? "Playback control may require Spotify Premium."
                : "Could not start playback. Try selecting this device in Spotify Connect.")
          );
          return;
        }
        router.push("/player");
      } catch {
        setFeedback("Network error starting playback.");
      } finally {
        setPlayingId(null);
      }
    },
    [spotifyDeviceId, router]
  );

  const playAlbum = useCallback(
    (id: string) => startPlayback(`spotify:album:${id}`, id),
    [startPlayback]
  );

  const playPlaylist = useCallback(
    (id: string) => startPlayback(`spotify:playlist:${id}`, id),
    [startPlayback]
  );

  if (error) {
    return (
      <div
        className={cn(
          "text-destructive flex flex-1 items-center justify-center p-6 text-center text-sm",
          className
        )}
      >
        {error}
      </div>
    );
  }

  if (playlists === null || albums === null) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm",
          className
        )}
      >
        Loading your library…
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-col gap-12 overflow-y-auto px-5 py-8 pb-24 sm:px-8",
        className
      )}
    >
      <div>
        <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight">
          Explore
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-sm">
          Saved albums and playlists from Spotify. Play sends audio to Vinylify
          on the Turntable tab (Web Playback).
        </p>
      </div>

      {feedback ? (
        <p
          className="text-destructive bg-destructive/10 rounded-xl px-4 py-3 text-sm"
          role="status"
        >
          {feedback}
        </p>
      ) : null}

      <section>
        <SectionHeader
          eyebrow="JUST PRESSED"
          title="New Arrivals"
          actionLabel="View all"
          onAction={() => {
            const el = albumsRailRef.current;
            if (el) {
              el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
            }
          }}
        />
        {albums.length === 0 ? (
          <p className="text-muted-foreground text-sm">No saved albums.</p>
        ) : (
          <div
            ref={albumsRailRef}
            className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-2 [scrollbar-width:thin]"
          >
            {albums.map((a) => (
              <AlbumRailItem
                key={a.id}
                album={a}
                onPlay={playAlbum}
                playingId={playingId}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Disc3 className={cn("size-6", accentClass)} aria-hidden />
          <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight">
            Your crates
          </h2>
        </div>
        <p className="text-muted-foreground mb-6 text-sm">
          Playlists from your library — tap Play to spin on the turntable.
        </p>
        {playlists.length === 0 ? (
          <p className="text-muted-foreground text-sm">No playlists found.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {playlists.map((p) => (
              <li key={p.id}>
                <PlaylistCrateCard
                  playlist={p}
                  onPlay={playPlaylist}
                  playingId={playingId}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
