import { getValidAccessToken } from "@/lib/spotify-session";

/** Returns a usable Spotify access token, refreshing it silently if expired. */
export async function getSpotifyAccessToken(): Promise<string | null> {
  return getValidAccessToken();
}
