import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Button, ErrorBanner, Field, Wordmark, type FieldRef } from '../ui/components';
import { colors, fonts, space, type } from '../ui/theme';

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
          <Text style={type.hero}>Gentle care,{'\n'}safe notes</Text>
          <Text style={styles.subtitle}>
            Your patients and their notes in one calm, private place. Sign in to continue.
          </Text>
        </View>

        <View style={styles.form}>
          <Field
            label="Email"
            labelColor="#fff"
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
            labelColor="#fff"
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
          variant="white"
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
  container: { flex: 1, backgroundColor: colors.sky },
  inner: { flexGrow: 1, paddingHorizontal: space.xl, width: '100%', maxWidth: 440, alignSelf: 'center' },
  hero: { marginTop: 56, gap: space.md },
  subtitle: { fontFamily: fonts.bodyBold, color: '#fff', fontSize: 14, lineHeight: 20, maxWidth: 300 },
  form: { marginTop: space.xxl, gap: space.lg },
  input: { borderColor: 'transparent', borderRadius: 22 },
  cta: { marginTop: 40, alignSelf: 'center', minWidth: 220 },
});
