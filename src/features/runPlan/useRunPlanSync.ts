import { useCallback, useEffect, useState } from 'react';

import { DEFAULT_RUN_PLAN } from '../../constants';
import { createWatchBridgeEmitter, isWatchBridgeAvailable, watchBridge } from '../../native/watchBridge';
import type { RunPlan } from '../../types';

export function useRunPlanSync() {
  const [runPlan, setRunPlan] = useState<RunPlan>(DEFAULT_RUN_PLAN);
  const [runPlanMessage, setRunPlanMessage] = useState('Run/walk plan will sync to Apple Watch.');

  useEffect(() => {
    if (!isWatchBridgeAvailable() || !watchBridge) {
      setRunPlanMessage('Run/walk plan is saved on iPhone when the native bridge is available.');
      return;
    }

    let isMounted = true;
    const emitter = createWatchBridgeEmitter();
    const subscription = emitter?.addListener('FitRunRunPlanUpdate', (plan: RunPlan) => {
      setRunPlan({ ...DEFAULT_RUN_PLAN, ...plan });
      setRunPlanMessage('Run/walk plan synced to Apple Watch.');
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
      subscription?.remove();
    };
  }, []);

  const saveRunPlan = useCallback(async (nextPlan: RunPlan) => {
    setRunPlan(nextPlan);

    if (!isWatchBridgeAvailable() || !watchBridge) {
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

  return {
    runPlan,
    runPlanMessage,
    updateRunPlan
  };
}
