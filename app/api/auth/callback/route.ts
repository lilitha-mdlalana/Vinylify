import axios from "axios";
import { getSpotifyRedirectUri } from "@/lib/spotify-redirect";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type SpotifyAuthApiResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
};

export async function GET(request: NextRequest) {
  const redirectUri = getSpotifyRedirectUri();
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", request.url)
    );
  }

  const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
  const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!spotify_client_id || !spotify_client_secret) {
    console.error(
      "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in the environment."
    );
    return NextResponse.redirect(new URL("/login?error=config", request.url));
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
      return NextResponse.redirect(new URL("/login?error=no_token", request.url));
    }

    const cookieStore = await cookies();
    cookieStore.set("spotify-token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.redirect(new URL("/player", request.url));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Spotify token error:",
        error.response?.status,
        error.response?.data
      );
    } else {
      console.error("Spotify token error:", error);
    }
    return NextResponse.redirect(
      new URL("/login?error=token_exchange", request.url)
    );
  }
}
