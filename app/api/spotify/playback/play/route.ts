import { getSpotifyAccessToken } from "@/lib/spotify-token";
import { spotifyFetchWithBackoff } from "@/lib/spotify-fetch-backoff";
import { NextRequest, NextResponse } from "next/server";

type PlayBody = {
  deviceId?: string;
  contextUri?: string;
  uris?: string[];
};

const CONTEXT_URI_RE =
  /^spotify:(album|playlist|artist):[a-zA-Z0-9]{10,}$/;
const TRACK_URI_RE = /^spotify:track:[a-zA-Z0-9]{10,}$/;

export async function POST(request: NextRequest) {
  const token = await getSpotifyAccessToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: PlayBody;
  try {
    body = (await request.json()) as PlayBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const deviceId =
    typeof body.deviceId === "string" ? body.deviceId.trim() : "";
  if (!deviceId) {
    return NextResponse.json(
      { error: "device_id_required", message: "Web Playback device is not ready." },
      { status: 400 }
    );
  }

  const contextUri =
    typeof body.contextUri === "string" ? body.contextUri.trim() : "";
  const uris = Array.isArray(body.uris) ? body.uris : [];

  if (contextUri && uris.length > 0) {
    return NextResponse.json(
      { error: "invalid_body", message: "Send contextUri or uris, not both." },
      { status: 400 }
    );
  }

  if (!contextUri && uris.length === 0) {
    return NextResponse.json(
      { error: "invalid_body", message: "contextUri or uris is required." },
      { status: 400 }
    );
  }

  if (contextUri && !CONTEXT_URI_RE.test(contextUri)) {
    return NextResponse.json({ error: "invalid_context_uri" }, { status: 400 });
  }

  if (uris.length > 0) {
    for (const u of uris) {
      if (typeof u !== "string" || !TRACK_URI_RE.test(u)) {
        return NextResponse.json({ error: "invalid_uris" }, { status: 400 });
      }
    }
  }

  const playUrl = new URL("https://api.spotify.com/v1/me/player/play");
  playUrl.searchParams.set("device_id", deviceId);

  const payload =
    contextUri.length > 0
      ? { context_uri: contextUri }
      : { uris };

  const res = await spotifyFetchWithBackoff(token, playUrl.toString(), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.status === 204) {
    return NextResponse.json({ ok: true });
  }

  let spotifyMessage: string | undefined;
  try {
    const err = (await res.json()) as { error?: { message?: string } };
    spotifyMessage = err?.error?.message;
  } catch {
    /* ignore */
  }

  const status = res.status === 429 ? 503 : res.status;
  return NextResponse.json(
    {
      error: "spotify_error",
      status: res.status,
      message: spotifyMessage ?? res.statusText,
    },
    { status }
  );
}
