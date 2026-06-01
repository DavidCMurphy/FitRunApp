import { useEffect, useState } from 'react';

import { createWatchBridgeEmitter, isWatchBridgeAvailable, watchBridge } from '../../native/watchBridge';
import type { WatchWorkout } from '../../types';

export function useWatchWorkout() {
  const [watchWorkout, setWatchWorkout] = useState<WatchWorkout | null>(null);
  const [watchMessage, setWatchMessage] = useState('Start a run on Apple Watch to stream workout data here.');

  useEffect(() => {
    if (!isWatchBridgeAvailable() || !watchBridge) {
      setWatchMessage('Watch workouts sync on iPhone with the FitRunApp watch extension installed.');
      return;
    }

    let isMounted = true;
    const emitter = createWatchBridgeEmitter();
    const subscription = emitter?.addListener('FitRunWatchWorkoutUpdate', (workout: WatchWorkout) => {
      setWatchWorkout(workout);
      setWatchMessage('Receiving workout data from Apple Watch.');
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

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  return {
    watchMessage,
    watchWorkout
  };
}
