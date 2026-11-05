import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import PatientListScreen from './src/screens/PatientListScreen';
import PatientFormScreen from './src/screens/PatientFormScreen';
import PatientDetailScreen from './src/screens/PatientDetailScreen';
import type { Patient } from './src/lib/types';

export type RootStackParamList = {
  PatientList: undefined;
  PatientForm: { patient?: Patient } | undefined;
  PatientDetail: { patient: Patient };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Re-lock when the app has been in the background longer than this.
const LOCK_AFTER_MS = 30_000;

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(true);
  const [lockError, setLockError] = useState<string | null>(null);
  const backgroundedAt = useRef<number | null>(null);
  const prompting = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const unlock = useCallback(async () => {
    if (prompting.current) return;
    prompting.current = true;
    setLockError(null);
    try {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setLockError('Set up a screen lock or biometrics on this phone to use the app.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock patient notes',
        disableDeviceFallback: false,
      });
      if (result.success) setLocked(false);
      else setLockError('Authentication failed. Try again.');
    } finally {
      prompting.current = false;
    }
  }, []);

  useEffect(() => {
    if (session && locked) unlock();
  }, [session, locked, unlock]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        backgroundedAt.current ??= Date.now();
      } else if (state === 'active') {
        const at = backgroundedAt.current;
        backgroundedAt.current = null;
        if (at && Date.now() - at > LOCK_AFTER_MS) setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!session) setLocked(true);
  }, [session]);

  let content: React.ReactNode;
  if (!ready) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  } else if (!session) {
    content = <LoginScreen />;
  } else if (locked) {
    content = (
      <View style={styles.center}>
        <Text style={styles.title}>Patient Notes</Text>
        <Text style={styles.sub}>Locked</Text>
        {lockError && <Text style={styles.error}>{lockError}</Text>}
        <Pressable style={styles.button} onPress={unlock}>
          <Text style={styles.buttonText}>Unlock</Text>
        </Pressable>
        <Pressable onPress={() => supabase.auth.signOut()}>
          <Text style={styles.link}>Sign out</Text>
        </Pressable>
      </View>
    );
  } else {
    content = (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="PatientList" component={PatientListScreen} options={{ title: 'Patients' }} />
          <Stack.Screen name="PatientForm" component={PatientFormScreen} options={{ title: 'Patient' }} />
          <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Notes' }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {content}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  sub: { fontSize: 16, color: '#555' },
  error: { color: '#b00020', textAlign: 'center' },
  button: { backgroundColor: '#0a6cff', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#0a6cff', marginTop: 8 },
});
