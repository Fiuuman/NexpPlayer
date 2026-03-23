import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { usePlayerStore } from '../src/store/playerStore';

const TRACKS = [
  {
    id: '1',
    title: 'Reckless Love',
    artist: 'Cory Asbury',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: '2',
    title: 'Way Maker',
    artist: 'Leeland',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
];

export const Content = () => {
  const { play } = usePlayerStore();

  return (
    <View style={styles.content}>
      <Text style={styles.header}>CHAPTER 1</Text>

      <FlatList
        data={TRACKS}
        numColumns={3}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => play(item)}
          >
            <View style={styles.cover}>
              {/* ▶️ кнопка как в Spotify */}
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶️</Text>
              </View>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.artist}>{item.artist}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },

  header: {
    color: '#fff',
    fontSize: 26,
    marginBottom: 20,
  },

  card: {
    width: 160,
    marginRight: 16,
    marginBottom: 20,
  },

  cover: {
    height: 160,
    borderRadius: 16,
    backgroundColor: '#1C2333',
    marginBottom: 10,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 10,
  },

  playButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#5B7CFA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  playIcon: {
    color: '#fff',
    fontSize: 18,
  },

  title: {
    color: '#fff',
    fontWeight: '600',
  },

  artist: {
    color: '#A0A7B8',
    fontSize: 12,
  },
});