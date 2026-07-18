import { CassetteDeck } from "@/components/player/skins/cassette/cassette-deck";
import type { DeckSkin } from "@/components/player/skins/types";
import { VinylSkinDeck } from "@/components/player/skins/vinyl/vinyl-skin";
import type { MixtapeTheme } from "@/types/mixtape";

export const deckSkins: Record<MixtapeTheme, DeckSkin> = {
  vinyl: { id: "vinyl", Deck: VinylSkinDeck },
  cassette: { id: "cassette", Deck: CassetteDeck },
};
