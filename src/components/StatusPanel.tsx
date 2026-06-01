import { Text, View } from 'react-native';

import { styles } from '../styles/appStyles';
import { formatTime } from '../utils/format';

type StatusPanelProps = {
  lastUpdated: Date | null;
  message: string;
};

export function StatusPanel({ lastUpdated, message }: StatusPanelProps) {
  return (
    <View style={styles.statusPanel}>
      <Text style={styles.statusText}>{message}</Text>
      <Text style={styles.updatedText}>Last refresh: {formatTime(lastUpdated)}</Text>
    </View>
  );
}
