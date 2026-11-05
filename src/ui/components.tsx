import { forwardRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { avatarColors, colors, initials, radius, space, type } from './theme';

type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, variant = 'primary', loading, disabled, style, ...rest }: ButtonProps) {
  const v = variants[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg },
        pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
        inactive && { opacity: 0.45 },
        style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : <Text style={[styles.buttonText, { color: v.fg }]}>{title}</Text>}
    </Pressable>
  );
}

const variants = {
  primary: { bg: colors.accent, fg: '#fff' },
  secondary: { bg: colors.accentSoft, fg: colors.accent },
  ghost: { bg: 'transparent', fg: colors.muted },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};

type FieldProps = TextInputProps & { label?: string };
export type FieldRef = ComponentRef<typeof TextInput>;

export const Field = forwardRef<FieldRef, FieldProps>(function Field({ label, style, onFocus, onBlur, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={type.label}>{label}</Text>}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.faint}
        selectionColor={colors.accent}
        style={[styles.input, focused && styles.inputFocused, style]}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        {...rest}
      />
    </View>
  );
});

export function Avatar({ name, seed, size = 40 }: { name: string; seed?: string; size?: number }) {
  const c = avatarColors(seed ?? name);
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.36, backgroundColor: c.bg }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38, color: c.fg }]}>{initials(name)}</Text>
    </View>
  );
}

type PillProps = {
  title: string;
  onPress: () => void;
  icon?: string;
  tone?: 'accent' | 'soft' | 'danger';
  accessibilityLabel?: string;
};

// Rounded, bouncy button for headers and quick actions.
export function Pill({ title, onPress, icon, tone = 'soft', accessibilityLabel }: PillProps) {
  const t = pillTones[tone];
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: t.bg },
        pressed && { transform: [{ scale: 0.93 }], opacity: 0.9 },
      ]}
    >
      {icon && <Text style={[styles.pillIcon, { color: t.fg }]}>{icon}</Text>}
      <Text style={[styles.pillText, { color: t.fg }]}>{title}</Text>
    </Pressable>
  );
}

const pillTones = {
  accent: { bg: colors.accent, fg: '#fff' },
  soft: { bg: '#ECECE8', fg: colors.ink },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};

export function TextAction({ title, onPress, tone = 'accent' }: { title: string; onPress: () => void; tone?: 'accent' | 'muted' | 'danger' }) {
  const color = tone === 'danger' ? colors.danger : tone === 'muted' ? colors.muted : colors.accent;
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.5 }}>
      <Text style={[styles.textAction, { color }]}>{title}</Text>
    </Pressable>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  buttonText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.1 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.ink,
  },
  inputFocused: { borderColor: colors.accent },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: radius.pill },
  pillIcon: { fontSize: 18, fontWeight: '700', marginTop: -1 },
  pillText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.1 },
  avatarText: { fontWeight: '800', letterSpacing: 0.3 },
  textAction: { fontSize: 15, fontWeight: '500' },
  banner: { backgroundColor: colors.dangerSoft, borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: space.md },
  bannerText: { color: colors.danger, fontSize: 14, lineHeight: 20 },
});
