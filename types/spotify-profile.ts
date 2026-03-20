/**
 * Spotify Web API current user profile (GET /v1/me)
 * @see https://developer.spotify.com/documentation/web-api/howtos/web-app-profile
 */
export type SpotifyUserProfile = {
  id: string;
  displayName: string | null;
  email: string | null;
  uri: string | null;
  /** Web API resource URL */
  href: string | null;
  /** open.spotify.com user URL */
  spotifyOpenUrl: string | null;
  imageUrl: string | null;
  country: string | null;
  product: string | null;
  followersTotal: number | null;
  explicitContentFilterEnabled: boolean | null;
  explicitContentFilterLocked: boolean | null;
};

export type MeResponse = {
  user: SpotifyUserProfile | null;
};
