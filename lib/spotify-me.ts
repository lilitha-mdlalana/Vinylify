/** Minimal /v1/me fetch for server-side identity checks (never trust client ids). */
export async function fetchSpotifyMe(
  token: string
): Promise<{ id: string; displayName: string | null } | null> {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as {
    id: string;
    display_name?: string | null;
  };
  return { id: data.id, displayName: data.display_name ?? null };
}
