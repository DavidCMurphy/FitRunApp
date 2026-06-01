import { Pressable, Text } from 'react-native';

import { styles } from '../styles/appStyles';

type ActionButtonProps = {
  kind: 'primary' | 'secondary';
  label: string;
  onPress: () => void;
};

export function ActionButton({ kind, label, onPress }: ActionButtonProps) {
  const isPrimary = kind === 'primary';

  return (
    <Pressable style={isPrimary ? styles.primaryButton : styles.secondaryButton} onPress={onPress}>
      <Text style={isPrimary ? styles.primaryButtonText : styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}
