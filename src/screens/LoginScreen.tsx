import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { useAuth } from '../features/auth/useAuth';
import type { RootStackParamList } from '../navigation/types';
import { styles } from '../styles/appStyles';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { error, isSubmitting, signIn, status } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit() {
    if (isSubmitting || status === 'checking') {
      return;
    }

    signIn(username.trim(), password);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.loginKeyboardView}
      >
        <View style={styles.loginContainer}>
          <View style={styles.loginHero}>
            <Text style={styles.loginEyebrow}>Welcome back</Text>
            <Text style={styles.loginTitle}>FitRunApp</Text>
            <Text style={styles.loginSubtitle}>Sign in to sync your steps, watch workouts, and run plan.</Text>
          </View>

          <View style={styles.loginForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="runner@example.com"
                placeholderTextColor="#98a2b3"
                returnKeyType="next"
                style={styles.textInput}
                textContentType="username"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#98a2b3"
                returnKeyType="done"
                secureTextEntry
                style={styles.textInput}
                textContentType="password"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleSubmit}
              />
            </View>

            {error && <Text style={styles.loginError}>{error}</Text>}

            <ActionButton
              disabled={isSubmitting || status === 'checking'}
              kind="primary"
              label={isSubmitting || status === 'checking' ? 'Signing in' : 'Sign in'}
              onPress={handleSubmit}
            />

            <View style={styles.authSwitch}>
              <Text style={styles.authSwitchText}>New to FitRunApp?</Text>
              <ActionButton
                disabled={isSubmitting || status === 'checking'}
                kind="secondary"
                label="Create account"
                onPress={() => navigation.navigate('CreateAccount')}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
