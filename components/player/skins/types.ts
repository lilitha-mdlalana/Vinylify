import type { MixtapeTheme } from "@/types/mixtape";
import type { ComponentType } from "react";

/**
 * Contract every deck skin renders against. Skins draw the hardware and drive
 * the SDK player directly for gestures; playback state arrives as props.
 */
export type DeckSkinProps = {
  coverUrl: string | null;
  isPlaying: boolean;
  player: SpotifyWebPlaybackPlayer | undefined;
  positionMs?: number;
  durationMs?: number;
  /** Mixtape context — unused by the default /player experience */
  title?: string;
  sideLabel?: string;
};

export type DeckSkin = {
  id: MixtapeTheme;
  Deck: ComponentType<DeckSkinProps>;
};
