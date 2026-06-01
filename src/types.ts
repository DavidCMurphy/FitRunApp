export type AppState = 'checking' | 'unavailable' | 'needsPermission' | 'loadingSteps' | 'ready' | 'error';

export type WatchWorkout = {
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

export type RunPlan = {
  title: string;
  enabled: boolean;
  runSeconds: number;
  walkSeconds: number;
  repeatCount: number;
  warmupSeconds: number;
  cooldownSeconds: number;
  updatedAt?: string;
};

export type FitRunWatchBridgeModule = {
  getLatestWorkout: () => Promise<WatchWorkout | null>;
  isWatchConnectivityAvailable: () => Promise<boolean>;
  getRunPlan: () => Promise<RunPlan | null>;
  setRunPlan: (plan: RunPlan) => Promise<RunPlan>;
};
