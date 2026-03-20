/**
 * Must match a Redirect URI in the Spotify Developer Dashboard exactly.
 * Default uses 127.0.0.1 so it is not confused with localhost (different cookie origin).
 */
export function getSpotifyRedirectUri(): string {
  const fromEnv = process.env.SPOTIFY_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;
  return "http://127.0.0.1:3000/api/auth/callback";
}
