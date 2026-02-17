import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text } from 'react-native';
import { supabase } from '@/services/supabase';
import { saveSession, clearSession } from '@/lib/secureStore';

type AuthState = 'loading' | 'ready' | 'auth_failed';

export default function RootLayout() {
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    async function initAuth() {
      try {
        let { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.error('Anonymous sign-in failed:', error);
            setAuthState('auth_failed');
            return;
          }
          session = data.session ?? null;
        }

        if (session?.access_token) {
          await saveSession(session.access_token);
        }
        setAuthState('ready');
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setAuthState('auth_failed');
      }
    }

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.access_token) {
          await saveSession(session.access_token);
        } else {
          await clearSession();
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (authState === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (authState === 'auth_failed') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ textAlign: 'center', marginBottom: 16 }}>
          Sign-in failed. In Supabase Dashboard go to Authentication → Providers and enable Anonymous sign-in.
        </Text>
        <Text
          style={{ color: '#0066cc', fontWeight: '600' }}
          onPress={() => setAuthState('loading')}
        >
          Retry
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
