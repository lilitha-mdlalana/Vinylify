import { createMixtape, listMixtapesByCreator } from "@/lib/mixtapes";
import { PLAYLIST_ID_RE, TRACK_URI_RE } from "@/lib/spotify";
import { fetchSpotifyMe } from "@/lib/spotify-me";
import { getSpotifyAccessToken } from "@/lib/spotify-token";
import type { MixtapeTheme, MixtapeTrack } from "@/types/mixtape";
import { NextRequest, NextResponse } from "next/server";

const LIMITS = {
  title: 80,
  dedication: 280,
  linerNotes: 2000,
  recipientName: 80,
  tracks: 200,
} as const;

const THEMES: MixtapeTheme[] = ["vinyl", "cassette"];

type CreateBody = {
  playlistId?: string;
  title?: string;
  theme?: string;
  dedication?: string | null;
  linerNotes?: string | null;
  recipientName?: string | null;
  tracks?: unknown;
};

function invalid(message: string) {
  return NextResponse.json({ error: "invalid_body", message }, { status: 400 });
}

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined; // signals invalid
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed.length <= max ? trimmed : undefined;
}

function parseTracks(value: unknown): MixtapeTrack[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > LIMITS.tracks) {
    return null;
  }
  const tracks: MixtapeTrack[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) {
      return null;
    }
    const t = raw as Record<string, unknown>;
    if (
      typeof t.uri !== "string" ||
      !TRACK_URI_RE.test(t.uri) ||
      typeof t.title !== "string" ||
      t.title.length === 0 ||
      typeof t.artists !== "string" ||
      typeof t.durationMs !== "number" ||
      !Number.isFinite(t.durationMs) ||
      (t.side !== "A" && t.side !== "B") ||
      typeof t.position !== "number" ||
      !Number.isInteger(t.position) ||
      t.position < 0 ||
      (t.imageUrl !== null && typeof t.imageUrl !== "string")
    ) {
      return null;
    }
    tracks.push({
      uri: t.uri,
      title: t.title.slice(0, 200),
      artists: t.artists.slice(0, 300),
      durationMs: t.durationMs,
      side: t.side,
      position: t.position,
      imageUrl: (t.imageUrl as string | null) ?? null,
    });
  }
  return tracks;
}

export async function POST(request: NextRequest) {
  const token = await getSpotifyAccessToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const playlistId = typeof body.playlistId === "string" ? body.playlistId : "";
  if (!PLAYLIST_ID_RE.test(playlistId)) {
    return invalid("A valid playlistId is required.");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title || title.length > LIMITS.title) {
    return invalid(`Title is required (max ${LIMITS.title} characters).`);
  }

  const theme = THEMES.includes(body.theme as MixtapeTheme)
    ? (body.theme as MixtapeTheme)
    : null;
  if (!theme) {
    return invalid("Theme must be 'vinyl' or 'cassette'.");
  }

  const dedication = optionalText(body.dedication, LIMITS.dedication);
  const linerNotes = optionalText(body.linerNotes, LIMITS.linerNotes);
  const recipientName = optionalText(body.recipientName, LIMITS.recipientName);
  if (
    dedication === undefined ||
    linerNotes === undefined ||
    recipientName === undefined
  ) {
    return invalid("Dedication, liner notes, or recipient is too long.");
  }

  const tracks = parseTracks(body.tracks);
  if (!tracks) {
    return invalid(`Tracks must be 1–${LIMITS.tracks} valid entries.`);
  }

  // Identity comes from Spotify, never the client
  const me = await fetchSpotifyMe(token);
  if (!me) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Playlist mosaic for the cover (MVP cover_source: 'playlist')
  let coverUrl: string | null = null;
  const playlistRes = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}?fields=images`,
    { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 0 } }
  );
  if (playlistRes.ok) {
    const playlistData = (await playlistRes.json()) as {
      images?: { url: string }[];
    };
    coverUrl = playlistData.images?.[0]?.url ?? null;
  }

  try {
    const mixtape = await createMixtape({
      playlistId,
      title,
      theme,
      dedication,
      linerNotes,
      recipientName,
      tracks,
      creatorSpotifyId: me.id,
      creatorDisplayName: me.displayName,
      coverUrl,
    });
    return NextResponse.json({ mixtape }, { status: 201 });
  } catch (error) {
    console.error("createMixtape failed:", error);
    return NextResponse.json({ error: "storage_error" }, { status: 500 });
  }
}

export async function GET() {
  const token = await getSpotifyAccessToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const me = await fetchSpotifyMe(token);
  if (!me) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const mixtapes = await listMixtapesByCreator(me.id);
    return NextResponse.json({ mixtapes });
  } catch (error) {
    console.error("listMixtapesByCreator failed:", error);
    return NextResponse.json({ error: "storage_error" }, { status: 500 });
  }
}
