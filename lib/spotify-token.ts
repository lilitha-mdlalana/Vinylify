import { cookies } from "next/headers";

export async function getSpotifyAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("spotify-token")?.value ?? null;
}
