import { Pressable, Text, View } from 'react-native';

import { styles } from '../styles/appStyles';
import type { RunPlan } from '../types';
import { clamp, formatDuration, runPlanTotalSeconds } from '../utils/format';

type RunPlanPanelProps = {
  message: string;
  onUpdate: (updates: Partial<RunPlan>) => void;
  plan: RunPlan;
};

export function RunPlanPanel({ message, onUpdate, plan }: RunPlanPanelProps) {
  const summary = plan.enabled
    ? `${formatDuration(plan.runSeconds)} run / ${formatDuration(plan.walkSeconds)} walk x ${plan.repeatCount}`
    : 'No run/walk prompts will be shown on the watch.';
  const total = formatDuration(runPlanTotalSeconds(plan));

  return (
    <View style={styles.planPanel}>
      <View style={styles.watchHeader}>
        <Text style={styles.planTitle}>5K run/walk plan</Text>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: plan.enabled }}
          style={[styles.planToggle, plan.enabled && styles.planToggleActive]}
          onPress={() => onUpdate({ enabled: !plan.enabled })}
        >
          <Text style={[styles.planToggleText, plan.enabled && styles.planToggleTextActive]}>
            {plan.enabled ? 'On' : 'Off'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.planSummary}>{summary}</Text>
      <Text style={styles.updatedText}>Estimated plan time: {total}</Text>

      <View style={styles.planControls}>
        <PlanStepper
          label="Run"
          value={plan.runSeconds}
          displayValue={formatDuration(plan.runSeconds)}
          onChange={(value) => onUpdate({ runSeconds: clamp(value, 15, 900) })}
          step={15}
        />
        <PlanStepper
          label="Walk"
          value={plan.walkSeconds}
          displayValue={formatDuration(plan.walkSeconds)}
          onChange={(value) => onUpdate({ walkSeconds: clamp(value, 15, 900) })}
          step={15}
        />
        <PlanStepper
          label="Repeats"
          value={plan.repeatCount}
          displayValue={`${plan.repeatCount}`}
          onChange={(value) => onUpdate({ repeatCount: clamp(value, 1, 40) })}
          step={1}
        />
        <PlanStepper
          label="Warmup"
          value={plan.warmupSeconds}
          displayValue={formatDuration(plan.warmupSeconds)}
          onChange={(value) => onUpdate({ warmupSeconds: clamp(value, 0, 1200) })}
          step={60}
        />
        <PlanStepper
          label="Cooldown"
          value={plan.cooldownSeconds}
          displayValue={formatDuration(plan.cooldownSeconds)}
          onChange={(value) => onUpdate({ cooldownSeconds: clamp(value, 0, 1200) })}
          step={60}
        />
      </View>

      <Text style={styles.planMessage}>{message}</Text>
    </View>
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
