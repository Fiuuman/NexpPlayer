import { View, Text, StyleSheet } from 'react-native';
import { usePlayerStore } from '../src/store/playerStore';

export default function PlayerScreen() {
  const { currentTrack, position, duration, next, prev, play, isPlaying } =
    usePlayerStore();

  const progress = position / duration;

  return (
    <View style={styles.container}>
      <View style={styles.cover} />

      <Text style={styles.title}>
        {currentTrack?.title || 'Нет трека'}
      </Text>

      <Text style={styles.artist}>
        {currentTrack?.artist || ''}
      </Text>

      {/* прогресс */}
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: `${progress * 100}%` }]} />
      </View>

      {/* 🎮 КНОПКИ УПРАВЛЕНИЯ */}
      <View style={styles.controls}>
        <Text style={styles.control} onPress={prev}>⏮</Text>

        <Text style={styles.control} onPress={() => play()}>
          {isPlaying ? '⏸' : '▶️'}
        </Text>

        <Text style={styles.control} onPress={next}>⏭</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  cover: {
    width: 250,
    height: 250,
    borderRadius: 20,
    backgroundColor: '#1C2333',
    marginBottom: 30,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  artist: {
    color: '#A0A7B8',
    marginBottom: 30,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  progress: {
    height: 4,
    backgroundColor: '#5B7CFA',
  },
  controls: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 40,
  },
  control: {
    color: '#fff',
    fontSize: 30,
  },
});