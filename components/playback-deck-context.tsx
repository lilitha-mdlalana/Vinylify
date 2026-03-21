"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type DeckPlaybackState = {
  coverUrl: string | null;
  /** True when this device is active, a track exists, and playback is not paused */
  isPlaying: boolean;
};

const defaultDeck: DeckPlaybackState = {
  coverUrl: null,
  isPlaying: false,
};

const PlaybackDeckContext = createContext<{
  deck: DeckPlaybackState;
  setDeckPlayback: (partial: Partial<DeckPlaybackState>) => void;
  spotifyDeviceId: string | null;
  setSpotifyDeviceId: (id: string | null) => void;
} | null>(null);

export function PlaybackDeckProvider({ children }: { children: ReactNode }) {
  const [deck, setDeck] = useState<DeckPlaybackState>(defaultDeck);
  const [spotifyDeviceId, setSpotifyDeviceIdState] = useState<string | null>(
    null
  );

  const setDeckPlayback = useCallback((partial: Partial<DeckPlaybackState>) => {
    setDeck((prev) => ({ ...prev, ...partial }));
  }, []);

  const setSpotifyDeviceId = useCallback((id: string | null) => {
    setSpotifyDeviceIdState(id);
  }, []);

  const value = useMemo(
    () => ({
      deck,
      setDeckPlayback,
      spotifyDeviceId,
      setSpotifyDeviceId,
    }),
    [deck, setDeckPlayback, spotifyDeviceId, setSpotifyDeviceId]
  );

  return (
    <PlaybackDeckContext.Provider value={value}>
      {children}
    </PlaybackDeckContext.Provider>
  );
}

export function usePlaybackDeck() {
  const ctx = useContext(PlaybackDeckContext);
  if (!ctx) {
    throw new Error("usePlaybackDeck must be used within PlaybackDeckProvider");
  }
  return ctx;
}
