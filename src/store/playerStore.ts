import { create } from 'zustand';
import { Audio } from 'expo-av';

type Track = {
  id: string;
  title: string;
  artist: string;
  url: string;
};

type PlayerState = {
  sound: Audio.Sound | null;
  currentTrack: Track | null;
  playlist: Track[];
  currentIndex: number;

  isPlaying: boolean;
  position: number;
  duration: number;

  play: (track?: Track, list?: Track[]) => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  sound: null,
  currentTrack: null,
  playlist: [],
  currentIndex: 0,

  isPlaying: false,
  position: 0,
  duration: 1,

  play: async (track, list) => {
    let { sound } = get();

    // 👉 если передали новый список
    if (list) {
      set({ playlist: list });
    }

    // 👉 если передали новый трек
    if (track) {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.url },
        {},
        (status) => {
          if (status.isLoaded) {
            set({
              position: status.positionMillis,
              duration: status.durationMillis || 1,
            });
          }
        }
      );

      const index = get().playlist.findIndex(t => t.id === track.id);

      set({
        sound: newSound,
        currentTrack: track,
        currentIndex: index >= 0 ? index : 0,
        isPlaying: true,
      });

      await newSound.playAsync();
      return;
    }

    // 👉 toggle play/pause
    if (sound) {
      const { isPlaying } = get();

      if (isPlaying) {
        await sound.pauseAsync();
        set({ isPlaying: false });
      } else {
        await sound.playAsync();
        set({ isPlaying: true });
      }
    }
  },

  next: async () => {
    const { playlist, currentIndex, play } = get();

    if (playlist.length === 0) return;

    const nextIndex = (currentIndex + 1) % playlist.length;
    await play(playlist[nextIndex]);
  },

  prev: async () => {
    const { playlist, currentIndex, play } = get();

    if (playlist.length === 0) return;

    const prevIndex =
      currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;

    await play(playlist[prevIndex]);
  },
}));