import axios from "axios";
import { cookies } from "next/headers";
import { decryptToken, encryptToken } from "@/lib/session-crypto";

export const ACCESS_TOKEN_COOKIE = "spotify-token";
export const TOKEN_EXPIRY_COOKIE = "spotify-token-expiry";
export const REFRESH_TOKEN_COOKIE = "spotify-refresh";
export const OAUTH_STATE_COOKIE = "spotify-oauth-state";
export const RETURN_TO_COOKIE = "spotify-return-to";

export const SESSION_COOKIES = [
  ACCESS_TOKEN_COOKIE,
  TOKEN_EXPIRY_COOKIE,
  REFRESH_TOKEN_COOKIE,
] as const;

/** Refresh this many ms before the access token actually expires */
const EXPIRY_MARGIN_MS = 60_000;
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  sameSite: "lax",
} as const;

/** Anything with a cookies-like set(); covers both cookies() store and NextResponse.cookies */
type CookieSetter = {
  set(
    name: string,
    value: string,
    options?: Partial<{
      httpOnly: boolean;
      secure: boolean;
      path: string;
      sameSite: "lax" | "strict" | "none";
      maxAge: number;
    }>
  ): unknown;
};

export type SpotifyTokens = {
  accessToken: string;
  /** Seconds until expiry, as reported by Spotify */
  expiresIn: number;
  refreshToken?: string | null;
};

/**
 * Writes the session cookies. Refresh token is encrypted at rest; if omitted
 * (Spotify does not always rotate it) the existing refresh cookie is left alone.
 */
export function setSessionCookies(target: CookieSetter, tokens: SpotifyTokens) {
  const expiresAt = Date.now() + tokens.expiresIn * 1000;
  target.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
  target.set(TOKEN_EXPIRY_COOKIE, String(expiresAt), {
    ...baseCookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
  if (tokens.refreshToken) {
    const sealed = encryptToken(tokens.refreshToken);
    if (sealed) {
      target.set(REFRESH_TOKEN_COOKIE, sealed, {
        ...baseCookieOptions,
        maxAge: REFRESH_COOKIE_MAX_AGE,
      });
    }
  }
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<SpotifyTokens | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set.");
    return null;
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  try {
    const { data } = await axios.post<{
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    }>("https://accounts.spotify.com/api/token", params, {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (!data.access_token) {
      return null;
    }
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in ?? 3600,
      // Spotify may rotate the refresh token; persist the new one when present
      refreshToken: data.refresh_token ?? null,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Spotify token refresh failed:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("Spotify token refresh failed:", error);
    }
    return null;
  }
}

/**
 * Returns a usable access token, silently refreshing it when expired (or
 * about to). Returns null when there is no session or the refresh fails —
 * callers should treat that as unauthenticated.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const expiryRaw = cookieStore.get(TOKEN_EXPIRY_COOKIE)?.value;
  const expiresAt = expiryRaw ? Number(expiryRaw) : null;

  const stillValid =
    accessToken &&
    (expiresAt === null || // legacy session without expiry info: trust it
      (Number.isFinite(expiresAt) && Date.now() < expiresAt - EXPIRY_MARGIN_MS));
  if (stillValid) {
    return accessToken;
  }

  const sealed = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const refreshToken = sealed ? decryptToken(sealed) : null;
  if (!refreshToken) {
    return accessToken; // nothing to refresh with; return whatever we have
  }

  const tokens = await refreshAccessToken(refreshToken);
  if (!tokens) {
    return null;
  }
  setSessionCookies(cookieStore, tokens);
  return tokens.accessToken;
}
