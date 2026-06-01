import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeEventEmitter, NativeModules, Platform, SafeAreaView, ScrollView } from 'react-native';
import {
  AuthorizationRequestStatus,
  getRequestStatusForAuthorization,
  isHealthDataAvailable,
  queryStatisticsForQuantity,
  requestAuthorization
} from '@kingstinct/react-native-healthkit';

import { ActionButton } from './src/components/ActionButton';
import { AppHeader } from './src/components/AppHeader';
import { RunPlanPanel } from './src/components/RunPlanPanel';
import { StatusPanel } from './src/components/StatusPanel';
import { StepsMetricPanel } from './src/components/StepsMetricPanel';
import { WatchWorkoutPanel } from './src/components/WatchWorkoutPanel';
import { DEFAULT_RUN_PLAN, STEP_TYPE } from './src/constants';
import { styles } from './src/styles/appStyles';
import type { AppState, FitRunWatchBridgeModule, RunPlan, WatchWorkout } from './src/types';
import { startOfToday } from './src/utils/format';

const watchBridge = NativeModules.FitRunWatchBridge as FitRunWatchBridgeModule | undefined;

export default function App() {
  const [appState, setAppState] = useState<AppState>('checking');
  const [steps, setSteps] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [message, setMessage] = useState('Checking HealthKit availability...');
  const [watchWorkout, setWatchWorkout] = useState<WatchWorkout | null>(null);
  const [watchMessage, setWatchMessage] = useState('Start a run on Apple Watch to stream workout data here.');
  const [runPlan, setRunPlan] = useState<RunPlan>(DEFAULT_RUN_PLAN);
  const [runPlanMessage, setRunPlanMessage] = useState('Run/walk plan will sync to Apple Watch.');

  const canRefresh = appState === 'ready' || appState === 'error';

  const loadSteps = useCallback(async () => {
    setAppState('loadingSteps');
    setMessage('Reading today\'s HealthKit step total...');

    const stats = await queryStatisticsForQuantity(STEP_TYPE, ['cumulativeSum'], {
      filter: {
        startDate: startOfToday(),
        endDate: new Date()
      },
      unit: 'count'
    });

    setSteps(Math.round(stats.sumQuantity?.quantity ?? 0));
    setLastUpdated(new Date());
    setMessage('Today\'s step count is synced from HealthKit.');
    setAppState('ready');
  }, []);

  const checkAuthorization = useCallback(async () => {
    try {
      setAppState('checking');
      setMessage('Checking HealthKit availability...');

      if (Platform.OS !== 'ios' || !isHealthDataAvailable()) {
        setAppState('unavailable');
        setMessage('HealthKit is available on iPhone with a custom Expo development build.');
        return;
      }

      const status = await getRequestStatusForAuthorization([], [STEP_TYPE]);

      if (status === AuthorizationRequestStatus.shouldRequest) {
        setAppState('needsPermission');
        setMessage('Connect HealthKit to let FitRunApp read your step count.');
        return;
      }

      await loadSteps();
    } catch (error) {
      setAppState('error');
      setMessage(error instanceof Error ? error.message : 'Unable to read HealthKit step data.');
    }
  }, [loadSteps]);

  const connectHealthKit = useCallback(async () => {
    try {
      setAppState('checking');
      setMessage('Opening HealthKit permissions...');
      await requestAuthorization([], [STEP_TYPE]);
      await loadSteps();
    } catch (error) {
      setAppState('error');
      setMessage(error instanceof Error ? error.message : 'HealthKit authorization was not completed.');
    }
  }, [loadSteps]);

  useEffect(() => {
    checkAuthorization();
  }, [checkAuthorization]);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !watchBridge) {
      setWatchMessage('Watch workouts sync on iPhone with the FitRunApp watch extension installed.');
      return;
    }

    let isMounted = true;
    const emitter = new NativeEventEmitter(NativeModules.FitRunWatchBridge);
    const subscription = emitter.addListener('FitRunWatchWorkoutUpdate', (workout: WatchWorkout) => {
      setWatchWorkout(workout);
      setWatchMessage('Receiving workout data from Apple Watch.');
    });
    const planSubscription = emitter.addListener('FitRunRunPlanUpdate', (plan: RunPlan) => {
      setRunPlan({ ...DEFAULT_RUN_PLAN, ...plan });
      setRunPlanMessage('Run/walk plan synced to Apple Watch.');
    });

    watchBridge
      .getLatestWorkout()
      .then((workout) => {
        if (isMounted && workout) {
          setWatchWorkout(workout);
          setWatchMessage('Loaded the latest Apple Watch workout update.');
        }
      })
      .catch(() => {
        if (isMounted) {
          setWatchMessage('Unable to read the latest watch workout update.');
        }
      });

    watchBridge
      .getRunPlan()
      .then((plan) => {
        if (isMounted && plan) {
          setRunPlan({ ...DEFAULT_RUN_PLAN, ...plan });
          setRunPlanMessage('Loaded saved run/walk plan.');
        }
      })
      .catch(() => {
        if (isMounted) {
          setRunPlanMessage('Using the default run/walk plan.');
        }
      });

    return () => {
      isMounted = false;
      subscription.remove();
      planSubscription.remove();
    };
  }, []);

  const saveRunPlan = useCallback(async (nextPlan: RunPlan) => {
    setRunPlan(nextPlan);

    if (Platform.OS !== 'ios' || !watchBridge) {
      setRunPlanMessage('Run/walk plan is saved on iPhone when the native bridge is available.');
      return;
    }

    try {
      const savedPlan = await watchBridge.setRunPlan(nextPlan);
      setRunPlan({ ...DEFAULT_RUN_PLAN, ...savedPlan });
      setRunPlanMessage(savedPlan.enabled ? 'Run/walk plan synced to Apple Watch.' : 'Run/walk plan paused on Apple Watch.');
    } catch (error) {
      setRunPlanMessage(error instanceof Error ? error.message : 'Unable to sync run/walk plan.');
    }
  }, []);

  const updateRunPlan = useCallback((updates: Partial<RunPlan>) => {
    void saveRunPlan({ ...runPlan, ...updates });
  }, [runPlan, saveRunPlan]);

  const stepsLabel = useMemo(() => {
    if (steps === null) {
      return '--';
    }

    return new Intl.NumberFormat().format(steps);
  }, [steps]);

  return (
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
  );
}
