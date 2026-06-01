import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getGetRunPlanQueryKey, useGetRunPlan, usePutRunPlan } from '../../api/generated/fitRunBackend';
import { DEFAULT_RUN_PLAN } from '../../constants';
import { createWatchBridgeEmitter, isWatchBridgeAvailable, watchBridge } from '../../native/watchBridge';
import type { RunPlan } from '../../types';

export function useRunPlanSync() {
  const queryClient = useQueryClient();
  const runPlanQuery = useGetRunPlan({
    query: {
      enabled: true
    }
  });
  const putRunPlanMutation = usePutRunPlan();
  const [runPlan, setRunPlan] = useState<RunPlan>(DEFAULT_RUN_PLAN);
  const [runPlanMessage, setRunPlanMessage] = useState('Save changes to sync this plan.');

  const loadWatchPlan = useCallback(async (isMounted: () => boolean) => {
    if (!isWatchBridgeAvailable() || !watchBridge) {
      if (isMounted()) {
        setRunPlanMessage('Using the default run/walk plan.');
      }
      return;
    }

    try {
      const watchPlan = await watchBridge.getRunPlan();
      if (isMounted() && watchPlan) {
        setRunPlan({ ...DEFAULT_RUN_PLAN, ...watchPlan });
        setRunPlanMessage('Loaded saved watch run/walk plan.');
      }
    } catch {
      if (isMounted()) {
        setRunPlanMessage('Using the default run/walk plan.');
      }
    }
  }, []);

  useEffect(() => {
    const emitter = createWatchBridgeEmitter();
    const subscription = emitter?.addListener('FitRunRunPlanUpdate', (plan: RunPlan) => {
      setRunPlan({ ...DEFAULT_RUN_PLAN, ...plan });
      setRunPlanMessage('Run/walk plan synced from Apple Watch.');
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialPlan() {
      if (!runPlanQuery.data) {
        return;
      }

      if (runPlanQuery.data.runPlan) {
        setRunPlan({ ...DEFAULT_RUN_PLAN, ...runPlanQuery.data.runPlan });
        setRunPlanMessage('Loaded saved run/walk plan.');
        return;
      }

      await loadWatchPlan(() => isMounted);
    }

    void loadInitialPlan();

    return () => {
      isMounted = false;
    };
  }, [loadWatchPlan, runPlanQuery.data]);

  const updateRunPlan = useCallback((updates: Partial<RunPlan>) => {
    setRunPlan((currentPlan) => ({ ...currentPlan, ...updates }));
    setRunPlanMessage('Unsaved changes.');
  }, []);

  const saveRunPlan = useCallback(async () => {
    setRunPlanMessage('Saving run/walk plan...');

    try {
      let nextPlan = runPlan;
      const canSyncWatch = isWatchBridgeAvailable() && Boolean(watchBridge);

      if (canSyncWatch && watchBridge) {
        nextPlan = { ...DEFAULT_RUN_PLAN, ...(await watchBridge.setRunPlan(runPlan)) };
        setRunPlan(nextPlan);
      }

      const response = await putRunPlanMutation.mutateAsync({ data: nextPlan });

      if (!response.runPlan) {
        throw new Error('Run/walk plan was not returned by the API.');
      }

      queryClient.setQueryData(getGetRunPlanQueryKey(), response);
      nextPlan = { ...DEFAULT_RUN_PLAN, ...response.runPlan };
      setRunPlan(nextPlan);

      if (canSyncWatch) {
        setRunPlanMessage('Run/walk plan synced to Apple Watch and saved to your account.');
        return;
      }

      setRunPlanMessage('Run/walk plan saved to your account.');
    } catch (error) {
      setRunPlanMessage(error instanceof Error ? error.message : 'Unable to save run/walk plan.');
    }
  }, [putRunPlanMutation, queryClient, runPlan]);

  return {
    isSavingRunPlan: putRunPlanMutation.isPending,
    runPlan,
    runPlanMessage,
    saveRunPlan,
    updateRunPlan
  };
}
