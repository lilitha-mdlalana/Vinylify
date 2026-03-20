import { getSpotifyAccessToken } from "@/lib/spotify-token";
import { NextResponse } from "next/server";

export async function GET() {
  const token = await getSpotifyAccessToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const res = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
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
      id: string;
      name: string;
      images: { url: string }[];
      tracks: { total: number };
      owner: { display_name: string | null };
    }[];
  };

  const playlists = data.items.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.images?.[0]?.url ?? null,
    trackCount: p.tracks?.total ?? 0,
    owner: p.owner?.display_name ?? null,
  }));

  return NextResponse.json({ playlists });
}
