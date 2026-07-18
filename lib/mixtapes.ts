import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type {
  CreateMixtapeInput,
  Mixtape,
  MixtapeTheme,
  MixtapeTrack,
} from "@/types/mixtape";
import { randomBytes } from "crypto";

type MixtapeRow = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  cover_url: string | null;
  dedication: string | null;
  liner_notes: string | null;
  recipient_name: string | null;
  creator_spotify_id: string;
  creator_display_name: string | null;
  playlist_id: string;
  tracks: MixtapeTrack[];
  created_at: string;
};

const MIXTAPE_COLUMNS =
  "id, slug, title, theme, cover_url, dedication, liner_notes, recipient_name, creator_spotify_id, creator_display_name, playlist_id, tracks, created_at";

function rowToMixtape(row: MixtapeRow): Mixtape {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    theme: (row.theme === "cassette" ? "cassette" : "vinyl") as MixtapeTheme,
    coverUrl: row.cover_url,
    dedication: row.dedication,
    linerNotes: row.liner_notes,
    recipientName: row.recipient_name,
    creatorDisplayName: row.creator_display_name,
    playlistId: row.playlist_id,
    tracks: row.tracks,
    createdAt: row.created_at,
  };
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/, "") || "mixtape"
  );
}

function randomSuffix(): string {
  return randomBytes(4).readUInt32BE(0).toString(36).slice(0, 6).padStart(6, "0");
}

const UNIQUE_VIOLATION = "23505";

export async function createMixtape(
  input: CreateMixtapeInput & {
    creatorSpotifyId: string;
    creatorDisplayName: string | null;
    coverUrl: string | null;
  }
): Promise<Mixtape> {
  const supabase = getSupabaseAdmin();
  const base = slugify(input.title);

  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = `${base}-${randomSuffix()}`;
    const { data, error } = await supabase
      .from("mixtapes")
      .insert({
        slug,
        title: input.title,
        theme: input.theme,
        cover_source: "playlist",
        cover_url: input.coverUrl,
        dedication: input.dedication ?? null,
        liner_notes: input.linerNotes ?? null,
        recipient_name: input.recipientName ?? null,
        creator_spotify_id: input.creatorSpotifyId,
        creator_display_name: input.creatorDisplayName,
        playlist_id: input.playlistId,
        tracks: input.tracks,
      })
      .select(MIXTAPE_COLUMNS)
      .single();

    if (!error && data) {
      return rowToMixtape(data as MixtapeRow);
    }
    if (error && error.code !== UNIQUE_VIOLATION) {
      throw new Error(`Failed to create mixtape: ${error.message}`);
    }
    // slug collision — regenerate suffix and retry
  }
  throw new Error("Failed to create mixtape: could not allocate a unique slug");
}

export async function getMixtapeBySlug(slug: string): Promise<Mixtape | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mixtapes")
    .select(MIXTAPE_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch mixtape: ${error.message}`);
  }
  return data ? rowToMixtape(data as MixtapeRow) : null;
}

export async function listMixtapesByCreator(
  creatorSpotifyId: string
): Promise<Mixtape[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mixtapes")
    .select(MIXTAPE_COLUMNS)
    .eq("creator_spotify_id", creatorSpotifyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list mixtapes: ${error.message}`);
  }
  return (data as MixtapeRow[]).map(rowToMixtape);
}

export async function deleteMixtape(
  id: string,
  creatorSpotifyId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mixtapes")
    .delete()
    .eq("id", id)
    .eq("creator_spotify_id", creatorSpotifyId)
    .select("id");

  if (error) {
    throw new Error(`Failed to delete mixtape: ${error.message}`);
  }
  return (data?.length ?? 0) > 0;
}
