import type { RunPlan } from './types';

export const STEP_TYPE = 'HKQuantityTypeIdentifierStepCount' as const;

export const DEFAULT_RUN_PLAN: RunPlan = {
  title: '5K Run Walk',
  enabled: true,
  runSeconds: 60,
  walkSeconds: 90,
  repeatCount: 8,
  warmupSeconds: 300,
  cooldownSeconds: 300
};
