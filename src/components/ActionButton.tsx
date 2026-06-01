import { Pressable, Text } from 'react-native';

import { styles } from '../styles/appStyles';

type ActionButtonProps = {
  kind: 'primary' | 'secondary';
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

export function ActionButton({ disabled = false, kind, label, onPress }: ActionButtonProps) {
  const isPrimary = kind === 'primary';
  const buttonStyle = isPrimary ? styles.primaryButton : styles.secondaryButton;
  const buttonTextStyle = isPrimary ? styles.primaryButtonText : styles.secondaryButtonText;

  return (
    <Pressable disabled={disabled} style={[buttonStyle, disabled && styles.disabledButton]} onPress={onPress}>
      <Text style={buttonTextStyle}>{label}</Text>
    </Pressable>
  );
}
