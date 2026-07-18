export type MixtapeSide = "A" | "B";

export type MixtapeTheme = "vinyl" | "cassette";

export type MixtapeTrack = {
  uri: string;
  title: string;
  artists: string;
  durationMs: number;
  side: MixtapeSide;
  /** 0-based order within its side */
  position: number;
  imageUrl: string | null;
};

export type Mixtape = {
  id: string;
  slug: string;
  title: string;
  theme: MixtapeTheme;
  coverUrl: string | null;
  dedication: string | null;
  linerNotes: string | null;
  recipientName: string | null;
  creatorDisplayName: string | null;
  playlistId: string;
  tracks: MixtapeTrack[];
  createdAt: string;
};

export type CreateMixtapeInput = {
  playlistId: string;
  title: string;
  theme: MixtapeTheme;
  dedication?: string | null;
  linerNotes?: string | null;
  recipientName?: string | null;
  tracks: MixtapeTrack[];
};
