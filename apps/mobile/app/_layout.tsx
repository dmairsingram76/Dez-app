import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text, TouchableOpacity, Linking } from 'react-native';
import { supabase } from '@/services/supabase';
import { saveSession, clearSession } from '@/lib/secureStore';

const SUPABASE_PROJECT_REF = 'rdyzascdpkdmbujvankt';
const AUTH_PROVIDERS_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/providers`;

type AuthState = 'loading' | 'ready';

export default function RootLayout() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [anonymousSignInFailed, setAnonymousSignInFailed] = useState(false);
  const [authHintDismissed, setAuthHintDismissed] = useState(false);

  useEffect(() => {
    async function initAuth() {
      try {
        let { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.error('Anonymous sign-in failed:', error);
            setAnonymousSignInFailed(true);
          } else {
            session = data.session ?? null;
            if (session?.access_token) {
              await saveSession(session.access_token);
            }
          }
        } else if (session?.access_token) {
          await saveSession(session.access_token);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setAnonymousSignInFailed(true);
      } finally {
        setAuthState('ready');
      }
    }

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.access_token) {
          await saveSession(session.access_token);
          setAnonymousSignInFailed(false);
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

  const showAuthBanner = anonymousSignInFailed && !authHintDismissed;

  return (
    <SafeAreaProvider>
      {showAuthBanner && (
        <View style={{ backgroundColor: '#fef3c7', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ flex: 1, fontSize: 13 }}>
            Enable Anonymous sign-in to save progress and get recommendations.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => Linking.openURL(AUTH_PROVIDERS_URL)}>
              <Text style={{ color: '#0066cc', fontWeight: '600', fontSize: 13 }}>Open settings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAuthHintDismissed(true)}>
              <Text style={{ color: '#666', fontWeight: '600', fontSize: 13 }}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
