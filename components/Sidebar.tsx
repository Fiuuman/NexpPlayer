import { View, Text, StyleSheet } from 'react-native';

export const Sidebar = () => {
  return (
    <View style={styles.sidebar}>
      <Text style={styles.logo}>Spotify</Text>
      <Text style={styles.sublogo}>Lite</Text>

      <View style={styles.menu}>
        <Text style={styles.active}>Home</Text>
        <Text style={styles.item}>Browse</Text>
        <Text style={styles.item}>Radio</Text>
      </View>

      <Text style={styles.section}>Your Library</Text>

      <Text style={styles.item}>Recently Played</Text>
      <Text style={styles.item}>Albums</Text>
      <Text style={styles.item}>Artists</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    backgroundColor: '#0B0F1A',
    padding: 20,
  },
  logo: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  menu: {
    marginBottom: 30,
  },
  active: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  item: {
    color: '#A0A7B8',
    marginBottom: 10,
  },
  section: {
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  sublogo: {
  color: '#5B7CFA',
  fontSize: 12,
  marginTop: -5,
  marginBottom: 20,
}
});