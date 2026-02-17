import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '@/services/supabase';
import { saveSession, clearSession } from '@/lib/secureStore';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Initialize auth and sync session to SecureStore
    async function initAuth() {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          await saveSession(session.access_token);
        } else {
          // Sign in anonymously if no session
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.error('Anonymous sign-in failed:', error);
          } else if (data.session?.access_token) {
            await saveSession(data.session.access_token);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setReady(true);
      }
    }

    initAuth();

    // Listen for auth changes and sync token
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

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
