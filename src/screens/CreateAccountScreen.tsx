import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/ActionButton';
import { useAuth } from '../features/auth/useAuth';
import { styles } from '../styles/appStyles';

export function CreateAccountScreen() {
  const { error, isSubmitting, signUp, status } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit() {
    if (isSubmitting || status === 'checking') {
      return;
    }

    const nextDisplayName = displayName.trim();
    const nextEmail = email.trim();

    if (nextDisplayName.length < 2) {
      setValidationError('Display name must be at least 2 characters.');
      return;
    }

    if (password.length < 12) {
      setValidationError('Password must be at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setValidationError(null);
    signUp(nextEmail, nextDisplayName, password);
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.loginKeyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.authScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginHero}>
            <Text style={styles.loginEyebrow}>Create account</Text>
            <Text style={styles.loginTitle}>Start running</Text>
            <Text style={styles.loginSubtitle}>Create your profile and connect your run data.</Text>
          </View>

          <View style={styles.loginForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display name</Text>
              <TextInput
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Runner"
                placeholderTextColor="#98a2b3"
                returnKeyType="next"
                style={styles.textInput}
                textContentType="name"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="runner@example.com"
                placeholderTextColor="#98a2b3"
                returnKeyType="next"
                style={styles.textInput}
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                autoComplete="off"
                placeholder="At least 12 characters"
                placeholderTextColor="#98a2b3"
                returnKeyType="next"
                secureTextEntry
                style={styles.textInput}
                textContentType="none"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm password</Text>
              <TextInput
                autoComplete="off"
                placeholder="Re-enter your password"
                placeholderTextColor="#98a2b3"
                returnKeyType="done"
                secureTextEntry
                style={styles.textInput}
                textContentType="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onSubmitEditing={handleSubmit}
              />
            </View>

            {(validationError || error) && <Text style={styles.loginError}>{validationError ?? error}</Text>}

            <ActionButton
              disabled={isSubmitting || status === 'checking'}
              kind="primary"
              label={isSubmitting || status === 'checking' ? 'Creating account' : 'Create account'}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
