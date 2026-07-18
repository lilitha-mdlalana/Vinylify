/** Shared Spotify URI validation. */

export const CONTEXT_URI_RE = /^spotify:(album|playlist|artist):[a-zA-Z0-9]{10,}$/;
export const TRACK_URI_RE = /^spotify:track:[a-zA-Z0-9]{10,}$/;
export const PLAYLIST_ID_RE = /^[a-zA-Z0-9]{10,}$/;
