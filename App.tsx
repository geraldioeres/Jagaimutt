import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import PatientListScreen from './src/screens/PatientListScreen';
import PatientFormScreen from './src/screens/PatientFormScreen';
import PatientDetailScreen from './src/screens/PatientDetailScreen';
import type { Facility, Patient } from './src/lib/types';
import { useFonts, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_500Medium, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Button, Wordmark } from './src/ui/components';
import { colors, fonts, space, type } from './src/ui/theme';

export type RootStackParamList = {
  PatientList: undefined;
  PatientForm: { patient?: Patient; facility?: Facility } | undefined;
  PatientDetail: { patient: Patient };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.background,
    text: colors.ink,
    border: colors.border,
  },
};

// Re-lock when the app has been in the background longer than this.
const LOCK_AFTER_MS = 30_000;

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(true);
  const [lockError, setLockError] = useState<string | null>(null);
  const backgroundedAt = useRef<number | null>(null);
  const prompting = useRef(false);
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

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
      // Biometrics don't exist in a browser; the account login is the only gate there.
      if (Platform.OS === 'web') {
        setLocked(false);
        return;
      }
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
  // A font that fails to load falls back to the system font rather than blocking the app.
  if (!ready || (!fontsLoaded && !fontError)) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  } else if (!session) {
    content = <LoginScreen />;
  } else if (locked) {
    content = (
      <View style={styles.center}>
        <Wordmark />
        <View style={styles.lock}>
          <View style={styles.lockShackle} />
          <View style={styles.lockBody} />
        </View>
        <Text style={[type.hero, { textAlign: 'center' }]}>Locked{'\n'}for privacy</Text>
        <Text style={styles.lockSub}>Unlock to see your patients and notes.</Text>
        {lockError && <Text style={styles.error}>{lockError}</Text>}
        <View style={styles.lockActions}>
          <Button title="unlock" chevron onPress={unlock} />
          <Button title="sign out" variant="ghost" onPress={() => supabase.auth.signOut()} />
        </View>
      </View>
    );
  } else {
    content = (
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { fontFamily: fonts.heading, fontSize: 19, color: colors.ink },
            headerTintColor: colors.accent,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="PatientList" component={PatientListScreen} options={{ title: 'Patients', headerShown: false }} />
          <Stack.Screen
            name="PatientForm"
            component={PatientFormScreen}
            options={({ route }) => ({ title: route.params?.patient ? 'Edit patient' : 'New patient', presentation: 'modal' })}
          />
          <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: '' }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {content}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: colors.background },
  lock: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    marginTop: 48,
    marginBottom: space.xl,
  },
  lockShackle: { width: 20, height: 16, borderWidth: 3.5, borderBottomWidth: 0, borderColor: colors.accent, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  lockBody: { width: 32, height: 23, borderRadius: 7, backgroundColor: colors.accent },
  lockSub: { fontFamily: fonts.bodyBold, color: colors.muted, fontSize: 15, marginTop: space.md, textAlign: 'center' },
  error: { color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: 12, overflow: 'hidden', padding: 10, textAlign: 'center', marginTop: space.lg, lineHeight: 20, fontFamily: fonts.bodyBold },
  lockActions: { maxWidth: 320, width: '100%', marginTop: 48, gap: space.sm, alignItems: 'stretch', alignSelf: 'center' },
});
