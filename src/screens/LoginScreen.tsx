import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { Button, ErrorBanner, Field, type FieldRef } from '../ui/components';
import { colors, radius, space, type } from '../ui/theme';

// Sign-up is intentionally absent: create her account in the Supabase dashboard.
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<FieldRef>(null);

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
      <View style={styles.inner}>
        <View style={styles.mark}>
          <View style={styles.markLine} />
          <View style={[styles.markLine, { width: 14 }]} />
        </View>
        <Text style={[type.display, { marginTop: space.xl }]}>Patient Notes</Text>
        <Text style={[type.caption, styles.subtitle]}>Sign in to continue</Text>

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
          />
          {error && <ErrorBanner message={error} />}
          <Button title="Sign in" onPress={submit} loading={busy} disabled={!email || !password} style={{ marginTop: space.sm }} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, justifyContent: 'center', padding: space.xl, width: '100%', maxWidth: 420, alignSelf: 'center' },
  mark: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.accent, justifyContent: 'center', paddingLeft: 14, gap: 5 },
  markLine: { width: 22, height: 3, borderRadius: 2, backgroundColor: '#fff' },
  subtitle: { marginTop: space.xs, fontSize: 16 },
  form: { marginTop: space.xxl, gap: space.lg },
});
