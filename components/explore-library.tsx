"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

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

function LibrarySection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <h2 className="text-foreground font-heading text-lg font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ItemCard({
  href,
  imageUrl,
  title,
  subtitle,
}: {
  href: string;
  imageUrl: string | null;
  title: string;
  subtitle: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-card hover:bg-muted/60 flex gap-3 rounded-xl p-2 ring-1 ring-foreground/10 transition-colors"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
            unoptimized
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
      </div>
    </a>
  );
}

export function ExploreLibrary({ className }: { className?: string }) {
  const [playlists, setPlaylists] = useState<PlaylistRow[] | null>(null);
  const [albums, setAlbums] = useState<AlbumRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        "mx-auto flex w-full max-w-3xl flex-col gap-10 overflow-y-auto p-6 pb-8",
        className
      )}
    >
      <div>
        <h1 className="font-heading text-foreground text-2xl font-semibold tracking-tight">
          Explore
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your playlists and saved albums on Spotify. Playback stays on the
          turntable tab.
        </p>
      </div>

      <LibrarySection title="Your playlists">
        {playlists.length === 0 ? (
          <p className="text-muted-foreground text-sm">No playlists found.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {playlists.map((p) => (
              <li key={p.id}>
                <ItemCard
                  href={`https://open.spotify.com/playlist/${p.id}`}
                  imageUrl={p.imageUrl}
                  title={p.name}
                  subtitle={`${p.trackCount} tracks${p.owner ? ` · ${p.owner}` : ""}`}
                />
              </li>
            ))}
          </ul>
        )}
      </LibrarySection>

      <LibrarySection title="Saved albums">
        {albums.length === 0 ? (
          <p className="text-muted-foreground text-sm">No saved albums.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {albums.map((a) => (
              <li key={a.id}>
                <ItemCard
                  href={`https://open.spotify.com/album/${a.id}`}
                  imageUrl={a.imageUrl}
                  title={a.name}
                  subtitle={`${a.artists} · ${a.trackCount} tracks`}
                />
              </li>
            ))}
          </ul>
        )}
      </LibrarySection>
    </div>
  );
}
