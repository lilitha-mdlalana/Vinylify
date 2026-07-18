import { getValidAccessToken } from "@/lib/spotify-session";
import { NextResponse } from "next/server";

/**
 * Returns the current Spotify access token for the Web Playback SDK.
 * The SDK runs in the browser and must receive tokens via getOAuthToken.
 * Refreshes silently when expired — this is what keeps long sessions alive.
 */
export async function GET() {
  const token = await getValidAccessToken();

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ access_token: token });
}
