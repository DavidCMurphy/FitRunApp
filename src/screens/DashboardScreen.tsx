import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { AppHeader } from '../components/AppHeader';
import { useAuth } from '../features/auth/useAuth';
import type { RootStackParamList } from '../navigation/types';
import { StatusPanel } from '../components/StatusPanel';
import { StepsMetricPanel } from '../components/StepsMetricPanel';
import { WatchWorkoutPanel } from '../components/WatchWorkoutPanel';
import { useHealthKitSteps } from '../features/steps/useHealthKitSteps';
import { useWatchWorkout } from '../features/watch/useWatchWorkout';
import { styles } from '../styles/appStyles';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { signOut } = useAuth();
  const {
    appState,
    canRefresh,
    connectHealthKit,
    lastUpdated,
    loadSteps,
    message,
    stepsLabel
  } = useHealthKitSteps();
  const { watchMessage, watchWorkout } = useWatchWorkout();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppHeader />
        <StepsMetricPanel appState={appState} stepsLabel={stepsLabel} />
        <StatusPanel lastUpdated={lastUpdated} message={message} />
        <WatchWorkoutPanel watchMessage={watchMessage} workout={watchWorkout} />

        {appState === 'needsPermission' && (
          <ActionButton kind="primary" label="Connect HealthKit" onPress={connectHealthKit} />
        )}

        {canRefresh && <ActionButton kind="secondary" label="Refresh steps" onPress={loadSteps} />}

        <ActionButton kind="secondary" label="5K run/walk plan" onPress={() => navigation.navigate('RunPlan')} />

        <ActionButton kind="secondary" label="Log out" onPress={signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}
