import { View, Text, StyleSheet } from 'react-native';
import { Sidebar } from '../../components/Sidebar';
import { Content } from '../../components/Content';
import { PlayerBar } from '../../components/PlayerBar';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Sidebar />
      <Content />
      <PlayerBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row', // 💥 ВАЖНО
    backgroundColor: '#0B0F1A',
  },
});