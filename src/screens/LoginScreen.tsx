import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Button, ErrorBanner, Field, Wordmark, type FieldRef } from '../ui/components';
import { colors, space, type } from '../ui/theme';

// Sign-up is intentionally absent: create her account in the Supabase dashboard.
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<FieldRef>(null);
  const insets = useSafeAreaInsets();

  const submit = async () => {
    if (!email || !password) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError(error.message);
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Wordmark />

        <View style={styles.hero}>
          <Text style={styles.headline}>Haiii lov, semangat jaganya! 🥨</Text>
        </View>

        <View style={styles.form}>
          <Field
            label="Email"
            placeholder="you@clinic.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => passwordRef.current?.focus()}
            style={styles.input}
          />
          <Field
            ref={passwordRef}
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            returnKeyType="go"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
            style={styles.input}
          />
          {error && <ErrorBanner message={error} />}
        </View>

        <Button
          title="sign in"
          chevron
          onPress={submit}
          loading={busy}
          disabled={!email || !password}
          style={styles.cta}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flexGrow: 1, paddingHorizontal: space.xl, width: '100%', maxWidth: 440, alignSelf: 'center' },
  hero: { marginTop: 56, gap: space.md },
  // Kept in the user's own casing, so no uppercase transform here.
  headline: { ...type.hero, textTransform: 'none', fontSize: 32, lineHeight: 38 },
  form: { marginTop: space.xxl, gap: space.lg },
  input: { borderRadius: 22 },
  cta: { marginTop: 40, alignSelf: 'center', minWidth: 220 },
});
