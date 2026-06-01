import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import {
  AuthorizationRequestStatus,
  getRequestStatusForAuthorization,
  isHealthDataAvailable,
  queryStatisticsForQuantity,
  requestAuthorization
} from '@kingstinct/react-native-healthkit';

import { STEP_TYPE } from '../../constants';
import type { AppState } from '../../types';
import { startOfToday } from '../../utils/format';

export function useHealthKitSteps() {
  const [appState, setAppState] = useState<AppState>('checking');
  const [steps, setSteps] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [message, setMessage] = useState('Checking HealthKit availability...');

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

  const stepsLabel = useMemo(() => {
    if (steps === null) {
      return '--';
    }

    return new Intl.NumberFormat().format(steps);
  }, [steps]);

  return {
    appState,
    canRefresh,
    connectHealthKit,
    lastUpdated,
    loadSteps,
    message,
    stepsLabel
  };
}
