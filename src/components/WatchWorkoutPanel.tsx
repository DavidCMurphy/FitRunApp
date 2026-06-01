import { Text, View } from 'react-native';

import { styles } from '../styles/appStyles';
import type { WatchWorkout } from '../types';
import { formatElapsed, formatWorkoutTimestamp } from '../utils/format';

type WatchWorkoutPanelProps = {
  watchMessage: string;
  workout: WatchWorkout | null;
};

export function WatchWorkoutPanel({ watchMessage, workout }: WatchWorkoutPanelProps) {
  return (
    <View style={styles.watchPanel}>
      <View style={styles.watchHeader}>
        <Text style={styles.watchTitle}>Watch workout</Text>
        <Text style={styles.watchState}>{workout?.state ?? 'idle'}</Text>
      </View>

      <Text style={styles.watchTimer}>{formatElapsed(workout?.elapsedSeconds)}</Text>

      <View style={styles.watchGrid}>
        <WatchMetric label="Energy" value={`${Math.round(workout?.activeEnergyKilocalories ?? 0)} kcal`} />
        <WatchMetric label="Distance" value={`${Math.round(workout?.distanceMeters ?? 0)} m`} />
        <WatchMetric label="Heart" value={`${Math.round(workout?.heartRateBPM ?? 0)} bpm`} />
        <WatchMetric label="Event" value={workout?.event ?? '--'} />
      </View>

      <Text style={styles.watchMessage}>{watchMessage}</Text>
      {workout?.intervalLabel && (
        <Text style={styles.watchMessage}>
          Current interval: {workout.intervalLabel} ({formatElapsed(workout.intervalRemainingSeconds)} left)
        </Text>
      )}
      <Text style={styles.updatedText}>Last watch update: {formatWorkoutTimestamp(workout?.receivedAt)}</Text>
    </View>
  );
}

type WatchMetricProps = {
  label: string;
  value: string;
};

function WatchMetric({ label, value }: WatchMetricProps) {
  return (
    <View style={styles.watchMetric}>
      <Text style={styles.watchMetricLabel}>{label}</Text>
      <Text style={styles.watchMetricValue}>{value}</Text>
    </View>
  );
}
