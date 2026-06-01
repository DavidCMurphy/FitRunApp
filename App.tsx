import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from './src/features/auth/useAuth';
import type { RootStackParamList } from './src/navigation/types';
import { CreateAccountScreen } from './src/screens/CreateAccountScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RunPlanScreen } from './src/screens/RunPlanScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

function AppNavigator() {
  const { status } = useAuth();
  const hasActiveToken = status === 'authenticated';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: '#f6f8f3'
        },
        headerTintColor: '#111827',
        headerTitleStyle: {
          fontWeight: '800'
        }
      }}
    >
      {hasActiveToken ? (
        <>
          <Stack.Screen component={DashboardScreen} name="Dashboard" options={{ headerShown: false }} />
          <Stack.Screen component={RunPlanScreen} name="RunPlan" options={{ title: '5K run/walk plan' }} />
        </>
      ) : (
        <>
          <Stack.Screen component={LoginScreen} name="Login" options={{ headerShown: false }} />
          <Stack.Screen component={CreateAccountScreen} name="CreateAccount" options={{ title: 'Create account' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
