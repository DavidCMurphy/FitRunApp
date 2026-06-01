import { ScrollView, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { RunPlanPanel } from '../components/RunPlanPanel';
import { useRunPlanSync } from '../features/runPlan/useRunPlanSync';
import { styles } from '../styles/appStyles';

export function RunPlanScreen() {
  const { isSavingRunPlan, runPlan, runPlanMessage, saveRunPlan, updateRunPlan } = useRunPlanSync();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <RunPlanPanel message={runPlanMessage} onUpdate={updateRunPlan} plan={runPlan} />
        <ActionButton
          disabled={isSavingRunPlan}
          kind="primary"
          label={isSavingRunPlan ? 'Saving plan' : 'Save plan'}
          onPress={saveRunPlan}
        />
      </ScrollView>
    </View>
  );
}
