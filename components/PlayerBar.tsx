import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePlayerStore } from '../src/store/playerStore';
import { useRouter } from 'expo-router';

export const PlayerBar = () => {
  const { play, isPlaying, currentTrack } = usePlayerStore();
  const router = useRouter();

  // ❌ не показываем если нет трека
  if (!currentTrack) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.9}
      onPress={() => router.push('/player')}
    >
      {/* 🎵 инфа о треке */}
      <View style={styles.info}>
        <View style={styles.cover} />

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>

          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>
      </View>

      {/* ▶️ кнопка */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={(e) => {
          e.stopPropagation(); // 💥 критично
          play();
        }}
      >
        <Text style={styles.play}>
          {isPlaying ? '⏸' : '▶️'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#1C2333',
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    // 🔥 чуть “воздуха” как в Spotify
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },

  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  cover: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2A3245',
  },

  title: {
    color: '#fff',
    fontWeight: '600',
  },

  artist: {
    color: '#A0A7B8',
    fontSize: 12,
  },

  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5B7CFA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  play: {
    fontSize: 18,
    color: '#fff',
  },
});