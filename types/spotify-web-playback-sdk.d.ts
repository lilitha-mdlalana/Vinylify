export {};

declare global {
  interface Window {
    Spotify?: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyWebPlaybackPlayer;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }

  /** Spotify Web Playback SDK player instance */
  interface SpotifyWebPlaybackPlayer {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: string, callback: (payload: unknown) => void): boolean;
    removeListener(event: string, callback?: (payload: unknown) => void): boolean;
    getCurrentState(): Promise<SpotifyPlaybackState | null>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    seek(positionMs: number): Promise<void>;
    setShuffle(state: boolean): Promise<void>;
    setRepeat(repeatMode: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
    togglePlay(): Promise<void>;
  }

  interface SpotifyPlaybackState {
    paused: boolean;
    position: number;
    duration: number;
    shuffle: boolean;
    repeat_mode: number;
    track_window: {
      current_track: SpotifyWebPlaybackTrack | null;
    };
  }

  interface SpotifyWebPlaybackTrack {
    name: string;
    album: { name: string; images: { url: string }[] };
    artists: { name: string }[];
  }
}
