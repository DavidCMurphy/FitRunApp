import { StatusBar } from 'expo-status-bar';
import { ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from './src/components/ActionButton';
import { AppHeader } from './src/components/AppHeader';
import { RunPlanPanel } from './src/components/RunPlanPanel';
import { StatusPanel } from './src/components/StatusPanel';
import { StepsMetricPanel } from './src/components/StepsMetricPanel';
import { WatchWorkoutPanel } from './src/components/WatchWorkoutPanel';
import { useRunPlanSync } from './src/features/runPlan/useRunPlanSync';
import { useHealthKitSteps } from './src/features/steps/useHealthKitSteps';
import { useWatchWorkout } from './src/features/watch/useWatchWorkout';
import { styles } from './src/styles/appStyles';

export default function App() {
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
  const { runPlan, runPlanMessage, updateRunPlan } = useRunPlanSync();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.container}>
          <AppHeader />
          <StepsMetricPanel appState={appState} stepsLabel={stepsLabel} />
          <StatusPanel lastUpdated={lastUpdated} message={message} />
          <WatchWorkoutPanel watchMessage={watchMessage} workout={watchWorkout} />
          <RunPlanPanel message={runPlanMessage} onUpdate={updateRunPlan} plan={runPlan} />

          {appState === 'needsPermission' && (
            <ActionButton kind="primary" label="Connect HealthKit" onPress={connectHealthKit} />
          )}

          {canRefresh && <ActionButton kind="secondary" label="Refresh steps" onPress={loadSteps} />}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
