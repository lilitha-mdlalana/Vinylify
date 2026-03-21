import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Returns the current Spotify access token for the Web Playback SDK.
 * The SDK runs in the browser and must receive tokens via getOAuthToken.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("spotify-token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ access_token: token });
}
