import { getSpotifyAccessToken } from "@/lib/spotify-token";
import { NextResponse } from "next/server";

export async function GET() {
  const token = await getSpotifyAccessToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const res = await fetch("https://api.spotify.com/v1/me/albums?limit=50", {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "spotify_error", status: res.status },
      { status: res.status }
    );
  }

  const data = (await res.json()) as {
    items: {
      album: {
        id: string;
        name: string;
        images: { url: string }[];
        artists: { name: string }[];
        total_tracks: number;
      };
    }[];
  };

  const albums = data.items.map(({ album: a }) => ({
    id: a.id,
    name: a.name,
    imageUrl: a.images?.[0]?.url ?? null,
    artists: a.artists.map((x) => x.name).join(", "),
    trackCount: a.total_tracks,
  }));

  return NextResponse.json({ albums });
}
