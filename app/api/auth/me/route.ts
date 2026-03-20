import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { SpotifyUserProfile } from "@/types/spotify-profile";

type SpotifyMeApi = {
  id: string;
  display_name?: string | null;
  email?: string | null;
  uri?: string;
  href?: string;
  country?: string;
  product?: string;
  external_urls?: { spotify?: string };
  followers?: { href: string | null; total: number };
  explicit_content?: {
    filter_enabled: boolean;
    filter_locked: boolean;
  };
  images?: { url: string; height?: number | null; width?: number | null }[];
};

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("spotify-token")?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return NextResponse.json({ user: null });
  }

  const data = (await res.json()) as SpotifyMeApi;
  const img = data.images?.[0];
  const explicit = data.explicit_content;

  const user: SpotifyUserProfile = {
    id: data.id,
    displayName: data.display_name ?? null,
    email: data.email ?? null,
    uri: data.uri ?? null,
    href: data.href ?? null,
    spotifyOpenUrl: data.external_urls?.spotify ?? null,
    imageUrl: img?.url ?? null,
    country: data.country ?? null,
    product: data.product ?? null,
    followersTotal: data.followers?.total ?? null,
    explicitContentFilterEnabled: explicit?.filter_enabled ?? null,
    explicitContentFilterLocked: explicit?.filter_locked ?? null,
  };

  return NextResponse.json({ user });
}
