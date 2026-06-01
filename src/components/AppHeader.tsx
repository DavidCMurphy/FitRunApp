import { Text, View } from 'react-native';

import { styles } from '../styles/appStyles';

export function AppHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.appName}>FitRunApp</Text>
      <Text style={styles.subtitle}>HealthKit steps</Text>
    </View>
  );
}
