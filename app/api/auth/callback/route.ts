import axios from "axios";
import { getSpotifyRedirectUri } from "@/lib/spotify-redirect";
import {
  OAUTH_STATE_COOKIE,
  RETURN_TO_COOKIE,
  setSessionCookies,
} from "@/lib/spotify-session";
import { NextRequest, NextResponse } from "next/server";

type SpotifyAuthApiResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
};

function errorRedirect(request: NextRequest, code: string) {
  const response = NextResponse.redirect(
    new URL(`/login?error=${code}`, request.url)
  );
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(RETURN_TO_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const redirectUri = getSpotifyRedirectUri();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!expectedState || !state || state !== expectedState) {
    return errorRedirect(request, "state_mismatch");
  }

  if (!code) {
    return errorRedirect(request, "missing_code");
  }

  const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
  const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!spotify_client_id || !spotify_client_secret) {
    console.error(
      "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in the environment."
    );
    return errorRedirect(request, "config");
  }

  const params = new URLSearchParams({
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  try {
    const { data } = await axios.post<SpotifyAuthApiResponse>(
      "https://accounts.spotify.com/api/token",
      params,
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${spotify_client_id}:${spotify_client_secret}`
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!data.access_token) {
      return errorRedirect(request, "no_token");
    }

    const returnTo = request.cookies.get(RETURN_TO_COOKIE)?.value;
    const destination =
      returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : "/player";

    const response = NextResponse.redirect(new URL(destination, request.url));
    setSessionCookies(response.cookies, {
      accessToken: data.access_token,
      expiresIn: data.expires_in ?? 3600,
      refreshToken: data.refresh_token ?? null,
    });
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.delete(RETURN_TO_COOKIE);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Spotify token error:", {
        status: error.response?.status,
        data: error.response?.data,
        code: error.code,
        message: error.message,
      });
    } else {
      console.error("Spotify token error:", error);
    }
    return errorRedirect(request, "token_exchange");
  }
}
