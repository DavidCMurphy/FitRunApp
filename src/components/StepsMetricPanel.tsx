import { ActivityIndicator, Text, View } from 'react-native';

import { styles } from '../styles/appStyles';
import type { AppState } from '../types';

type StepsMetricPanelProps = {
  appState: AppState;
  stepsLabel: string;
};

export function StepsMetricPanel({ appState, stepsLabel }: StepsMetricPanelProps) {
  const isLoading = appState === 'checking' || appState === 'loadingSteps';

  return (
    <View style={styles.metricPanel}>
      <Text style={styles.metricLabel}>Today</Text>
      <Text style={styles.metricValue}>{stepsLabel}</Text>
      <Text style={styles.metricUnit}>steps</Text>
      {isLoading && <ActivityIndicator color="#111827" style={styles.loader} />}
    </View>
  );
}
