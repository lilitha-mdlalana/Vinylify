import { getSpotifyRedirectUri } from "@/lib/spotify-redirect";
import {
  OAUTH_STATE_COOKIE,
  RETURN_TO_COOKIE,
} from "@/lib/spotify-session";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const STATE_COOKIE_MAX_AGE = 600; // 10 minutes

/** Only allow same-site relative paths like /m/abc — no protocol-relative or absolute URLs */
function sanitizeReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const scope: string =
    "streaming user-modify-playback-state user-read-email user-read-private user-library-read playlist-read-private";
  const spotify_redirect_uri = getSpotifyRedirectUri();
  const state = randomBytes(16).toString("hex");

  let spotify_client_id: string = "";
  if (process.env.SPOTIFY_CLIENT_ID) {
    spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
  } else {
    console.error(
      'Undefined Error: An environmental variable, "SPOTIFY_CLIENT_ID", has something wrong.'
    );
  }

  const auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: spotify_client_id,
    scope: scope,
    redirect_uri: spotify_redirect_uri,
    state: state,
  });

  const response = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${auth_query_parameters.toString()}`
  );

  const stateCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: STATE_COOKIE_MAX_AGE,
  } as const;

  response.cookies.set(OAUTH_STATE_COOKIE, state, stateCookieOptions);

  const returnTo = sanitizeReturnTo(
    request.nextUrl.searchParams.get("returnTo")
  );
  if (returnTo) {
    response.cookies.set(RETURN_TO_COOKIE, returnTo, stateCookieOptions);
  }

  return response;
}
