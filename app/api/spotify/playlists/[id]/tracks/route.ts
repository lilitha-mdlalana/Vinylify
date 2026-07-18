import { PLAYLIST_ID_RE } from "@/lib/spotify";
import { spotifyFetchWithBackoff } from "@/lib/spotify-fetch-backoff";
import { getSpotifyAccessToken } from "@/lib/spotify-token";
import { NextRequest, NextResponse } from "next/server";

const PAGE_LIMIT = 100;
const MAX_TRACKS = 200;

type SpotifyPlaylistItem = {
  uri: string;
  name: string;
  duration_ms: number;
  is_local?: boolean;
  artists: { name: string }[];
  album?: { images?: { url: string }[] };
};

// Feb 2026 API migration renamed /tracks → /items and the per-item key
// "track" → "item". Read both so a rollback doesn't break us.
type SpotifyPlaylistItemsPage = {
  items: {
    is_local?: boolean;
    item?: SpotifyPlaylistItem | null;
    track?: SpotifyPlaylistItem | null;
  }[];
  next: string | null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getSpotifyAccessToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!PLAYLIST_ID_RE.test(id)) {
    return NextResponse.json({ error: "invalid_playlist_id" }, { status: 400 });
  }

  const fields =
    "next,items(is_local,item(uri,name,duration_ms,is_local,artists(name),album(images)))";
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${id}/items?limit=${PAGE_LIMIT}&fields=${encodeURIComponent(fields)}`;

  const tracks: {
    uri: string;
    title: string;
    artists: string;
    durationMs: number;
    imageUrl: string | null;
  }[] = [];

  while (url && tracks.length < MAX_TRACKS) {
    const res = await spotifyFetchWithBackoff(token, url, {
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      let spotifyMessage: string | undefined;
      try {
        const err = (await res.json()) as { error?: { message?: string } };
        spotifyMessage = err?.error?.message;
      } catch {
        /* non-JSON error body */
      }
      console.error("Playlist items fetch failed:", {
        playlistId: id,
        status: res.status,
        message: spotifyMessage,
      });
      return NextResponse.json(
        {
          error: "spotify_error",
          status: res.status,
          message: spotifyMessage ?? res.statusText,
        },
        { status: res.status === 429 ? 503 : res.status }
      );
    }

    const page = (await res.json()) as SpotifyPlaylistItemsPage;
    for (const entry of page.items) {
      const t = entry.item ?? entry.track;
      if (
        !t ||
        entry.is_local ||
        t.is_local ||
        !t.uri.startsWith("spotify:track:")
      ) {
        continue;
      }
      tracks.push({
        uri: t.uri,
        title: t.name,
        artists: t.artists.map((a) => a.name).join(", "),
        durationMs: t.duration_ms,
        imageUrl: t.album?.images?.[t.album.images.length - 1]?.url ?? null,
      });
      if (tracks.length >= MAX_TRACKS) {
        break;
      }
    }
    url = page.next;
  }

  return NextResponse.json({ tracks });
}
