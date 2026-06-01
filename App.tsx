import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  NativeEventEmitter,
  NativeModules,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  AuthorizationRequestStatus,
  getRequestStatusForAuthorization,
  isHealthDataAvailable,
  queryStatisticsForQuantity,
  requestAuthorization
} from '@kingstinct/react-native-healthkit';

const STEP_TYPE = 'HKQuantityTypeIdentifierStepCount' as const;

type AppState = 'checking' | 'unavailable' | 'needsPermission' | 'loadingSteps' | 'ready' | 'error';
type WatchWorkout = {
  event?: string;
  state?: string;
  activityType?: string;
  startedAt?: string;
  endedAt?: string;
  elapsedSeconds?: number;
  activeEnergyKilocalories?: number;
  distanceMeters?: number;
  heartRateBPM?: number;
  collectedAt?: string;
  receivedAt?: string;
  intervalLabel?: string;
  intervalRemainingSeconds?: number;
  intervalIndex?: number;
  intervalTotal?: number;
  runPlanTitle?: string;
};

type RunPlan = {
  title: string;
  enabled: boolean;
  runSeconds: number;
  walkSeconds: number;
  repeatCount: number;
  warmupSeconds: number;
  cooldownSeconds: number;
  updatedAt?: string;
};

type FitRunWatchBridgeModule = {
  getLatestWorkout: () => Promise<WatchWorkout | null>;
  isWatchConnectivityAvailable: () => Promise<boolean>;
  getRunPlan: () => Promise<RunPlan | null>;
  setRunPlan: (plan: RunPlan) => Promise<RunPlan>;
};

const watchBridge = NativeModules.FitRunWatchBridge as FitRunWatchBridgeModule | undefined;
const DEFAULT_RUN_PLAN: RunPlan = {
  title: '5K Run Walk',
  enabled: true,
  runSeconds: 60,
  walkSeconds: 90,
  repeatCount: 8,
  warmupSeconds: 300,
  cooldownSeconds: 300
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatTime(date: Date | null) {
  if (!date) {
    return 'Not refreshed yet';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function formatElapsed(totalSeconds?: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds ?? 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  if (seconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function runPlanTotalSeconds(plan: RunPlan) {
  return plan.warmupSeconds + plan.cooldownSeconds + (plan.runSeconds + plan.walkSeconds) * plan.repeatCount;
}

function formatWorkoutTimestamp(value?: string) {
  if (!value) {
    return 'Waiting for watch';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value));
}

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

  const runPlanSummary = useMemo(() => {
    if (!runPlan.enabled) {
      return 'No run/walk prompts will be shown on the watch.';
    }

    return `${formatDuration(runPlan.runSeconds)} run / ${formatDuration(runPlan.walkSeconds)} walk x ${runPlan.repeatCount}`;
  }, [runPlan]);

  const runPlanTotal = useMemo(() => formatDuration(runPlanTotalSeconds(runPlan)), [runPlan]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.appName}>FitRunApp</Text>
          <Text style={styles.subtitle}>HealthKit steps</Text>
        </View>

        <View style={styles.metricPanel}>
          <Text style={styles.metricLabel}>Today</Text>
          <Text style={styles.metricValue}>{stepsLabel}</Text>
          <Text style={styles.metricUnit}>steps</Text>
          {(appState === 'checking' || appState === 'loadingSteps') && (
            <ActivityIndicator color="#111827" style={styles.loader} />
          )}
        </View>

        <View style={styles.statusPanel}>
          <Text style={styles.statusText}>{message}</Text>
          <Text style={styles.updatedText}>Last refresh: {formatTime(lastUpdated)}</Text>
        </View>

        <View style={styles.watchPanel}>
          <View style={styles.watchHeader}>
            <Text style={styles.watchTitle}>Watch workout</Text>
            <Text style={styles.watchState}>{watchWorkout?.state ?? 'idle'}</Text>
          </View>

          <Text style={styles.watchTimer}>{formatElapsed(watchWorkout?.elapsedSeconds)}</Text>

          <View style={styles.watchGrid}>
            <View style={styles.watchMetric}>
              <Text style={styles.watchMetricLabel}>Energy</Text>
              <Text style={styles.watchMetricValue}>
                {Math.round(watchWorkout?.activeEnergyKilocalories ?? 0)} kcal
              </Text>
            </View>
            <View style={styles.watchMetric}>
              <Text style={styles.watchMetricLabel}>Distance</Text>
              <Text style={styles.watchMetricValue}>
                {Math.round(watchWorkout?.distanceMeters ?? 0)} m
              </Text>
            </View>
            <View style={styles.watchMetric}>
              <Text style={styles.watchMetricLabel}>Heart</Text>
              <Text style={styles.watchMetricValue}>
                {Math.round(watchWorkout?.heartRateBPM ?? 0)} bpm
              </Text>
            </View>
            <View style={styles.watchMetric}>
              <Text style={styles.watchMetricLabel}>Event</Text>
              <Text style={styles.watchMetricValue}>{watchWorkout?.event ?? '--'}</Text>
            </View>
          </View>

          <Text style={styles.watchMessage}>{watchMessage}</Text>
          {watchWorkout?.intervalLabel && (
            <Text style={styles.watchMessage}>
              Current interval: {watchWorkout.intervalLabel} ({formatElapsed(watchWorkout.intervalRemainingSeconds)} left)
            </Text>
          )}
          <Text style={styles.updatedText}>
            Last watch update: {formatWorkoutTimestamp(watchWorkout?.receivedAt)}
          </Text>
        </View>

        <View style={styles.planPanel}>
          <View style={styles.watchHeader}>
            <Text style={styles.planTitle}>5K run/walk plan</Text>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: runPlan.enabled }}
              style={[styles.planToggle, runPlan.enabled && styles.planToggleActive]}
              onPress={() => updateRunPlan({ enabled: !runPlan.enabled })}
            >
              <Text style={[styles.planToggleText, runPlan.enabled && styles.planToggleTextActive]}>
                {runPlan.enabled ? 'On' : 'Off'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.planSummary}>{runPlanSummary}</Text>
          <Text style={styles.updatedText}>Estimated plan time: {runPlanTotal}</Text>

          <View style={styles.planControls}>
            <PlanStepper
              label="Run"
              value={runPlan.runSeconds}
              displayValue={formatDuration(runPlan.runSeconds)}
              onChange={(value) => updateRunPlan({ runSeconds: clamp(value, 15, 900) })}
              step={15}
            />
            <PlanStepper
              label="Walk"
              value={runPlan.walkSeconds}
              displayValue={formatDuration(runPlan.walkSeconds)}
              onChange={(value) => updateRunPlan({ walkSeconds: clamp(value, 15, 900) })}
              step={15}
            />
            <PlanStepper
              label="Repeats"
              value={runPlan.repeatCount}
              displayValue={`${runPlan.repeatCount}`}
              onChange={(value) => updateRunPlan({ repeatCount: clamp(value, 1, 40) })}
              step={1}
            />
            <PlanStepper
              label="Warmup"
              value={runPlan.warmupSeconds}
              displayValue={formatDuration(runPlan.warmupSeconds)}
              onChange={(value) => updateRunPlan({ warmupSeconds: clamp(value, 0, 1200) })}
              step={60}
            />
            <PlanStepper
              label="Cooldown"
              value={runPlan.cooldownSeconds}
              displayValue={formatDuration(runPlan.cooldownSeconds)}
              onChange={(value) => updateRunPlan({ cooldownSeconds: clamp(value, 0, 1200) })}
              step={60}
            />
          </View>

          <Text style={styles.planMessage}>{runPlanMessage}</Text>
        </View>

        {appState === 'needsPermission' && (
          <Pressable style={styles.primaryButton} onPress={connectHealthKit}>
            <Text style={styles.primaryButtonText}>Connect HealthKit</Text>
          </Pressable>
        )}

        {canRefresh && (
          <Pressable style={styles.secondaryButton} onPress={loadSteps}>
            <Text style={styles.secondaryButtonText}>Refresh steps</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type PlanStepperProps = {
  label: string;
  value: number;
  displayValue: string;
  step: number;
  onChange: (value: number) => void;
};

function PlanStepper({ label, value, displayValue, step, onChange }: PlanStepperProps) {
  return (
    <View style={styles.planControl}>
      <Text style={styles.planControlLabel}>{label}</Text>
      <View style={styles.planStepper}>
        <Pressable style={styles.stepperButton} onPress={() => onChange(value - step)}>
          <Text style={styles.stepperButtonText}>-</Text>
        </Pressable>
        <Text style={styles.planControlValue}>{displayValue}</Text>
        <Pressable style={styles.stepperButton} onPress={() => onChange(value + step)}>
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f8f3'
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 18
  },
  header: {
    gap: 6
  },
  appName: {
    color: '#111827',
    fontSize: 34,
    fontWeight: '800'
  },
  subtitle: {
    color: '#667085',
    fontSize: 16,
    fontWeight: '600'
  },
  metricPanel: {
    minHeight: 245,
    borderRadius: 8,
    backgroundColor: '#d8f36f',
    padding: 24,
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 30,
    elevation: 4
  },
  metricLabel: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10
  },
  metricValue: {
    color: '#111827',
    fontSize: 70,
    fontWeight: '900'
  },
  metricUnit: {
    color: '#1f2937',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2
  },
  loader: {
    position: 'absolute',
    right: 24,
    top: 24
  },
  statusPanel: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    padding: 18,
    gap: 10
  },
  statusText: {
    color: '#111827',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600'
  },
  updatedText: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '600'
  },
  watchPanel: {
    borderRadius: 8,
    backgroundColor: '#111827',
    padding: 18,
    gap: 12
  },
  watchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  watchTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800'
  },
  watchState: {
    color: '#d8f36f',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  watchTimer: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '900'
  },
  watchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  watchMetric: {
    width: '47%',
    borderRadius: 8,
    backgroundColor: '#1f2937',
    padding: 12,
    gap: 4
  },
  watchMetricLabel: {
    color: '#a7b0c0',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  watchMetricValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  watchMessage: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  },
  planPanel: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    padding: 18,
    gap: 12
  },
  planTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800'
  },
  planToggle: {
    minWidth: 54,
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  planToggleActive: {
    backgroundColor: '#d8f36f',
    borderColor: '#abc92e'
  },
  planToggleText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '900'
  },
  planToggleTextActive: {
    color: '#111827'
  },
  planSummary: {
    color: '#111827',
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '800'
  },
  planControls: {
    gap: 10
  },
  planControl: {
    minHeight: 58,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  planControlLabel: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '800'
  },
  planStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  planControlValue: {
    minWidth: 64,
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center'
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperButtonText: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '900'
  },
  planMessage: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800'
  }
});
