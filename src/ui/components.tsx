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
import { avatarColors, colors, fonts, initials, radius, shadow, space, type } from './theme';

type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: 'primary' | 'ghost' | 'danger';
  chevron?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, variant = 'primary', chevron, loading, disabled, style, ...rest }: ButtonProps) {
  const v = variants[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg },
        v.raised && shadow,
        pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
        inactive && { opacity: 0.5 },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <Text style={[styles.buttonText, { color: v.fg }]}>
          {title}
          {chevron ? '   ›' : ''}
        </Text>
      )}
    </Pressable>
  );
}

const variants = {
  primary: { bg: colors.accent, fg: '#fff', raised: true },
  ghost: { bg: 'transparent', fg: colors.muted, raised: false },
  danger: { bg: colors.dangerSoft, fg: colors.danger, raised: false },
};

type FieldProps = TextInputProps & { label?: string };
export type FieldRef = ComponentRef<typeof TextInput>;

export const Field = forwardRef<FieldRef, FieldProps>(function Field({ label, style, onFocus, onBlur, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={[type.label, styles.fieldLabel]}>{label}</Text>}
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
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: c.bg }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36, color: c.fg }]}>{initials(name)}</Text>
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

// Small rounded button for headers and quick actions.
export function Pill({ title, onPress, icon, tone = 'soft', accessibilityLabel }: PillProps) {
  const t = pillTones[tone];
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [styles.pill, { backgroundColor: t.bg }, pressed && { transform: [{ scale: 0.93 }], opacity: 0.9 }]}
    >
      {icon && <Text style={[styles.pillIcon, { color: t.fg }]}>{icon}</Text>}
      <Text style={[styles.pillText, { color: t.fg }]}>{title}</Text>
    </Pressable>
  );
}

const pillTones = {
  accent: { bg: colors.accent, fg: '#fff' },
  soft: { bg: colors.accentSoft, fg: colors.accent },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};

// Round button with a single glyph, e.g. the floating "+" or a card's overlapping action.
export function RoundButton({
  glyph,
  onPress,
  size = 56,
  accessibilityLabel,
  style,
}: {
  glyph: string;
  onPress: () => void;
  size?: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.round,
        { width: size, height: size, borderRadius: size / 2 },
        shadow,
        pressed && { transform: [{ scale: 0.92 }] },
        style,
      ]}
    >
      <Text style={[styles.roundGlyph, { fontSize: size * 0.46, lineHeight: size * 0.56 }]}>{glyph}</Text>
    </Pressable>
  );
}

// Outline "person" icon drawn with views, for the account button.
export function PersonButton({ onPress, color = colors.muted }: { onPress: () => void; color?: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Account"
      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.5 }]}
    >
      <View style={[styles.personHead, { borderColor: color }]} />
      <View style={[styles.personBody, { borderColor: color }]} />
    </Pressable>
  );
}

// Outline calendar icon drawn with views.
export function CalendarButton({ onPress, color = colors.muted }: { onPress: () => void; color?: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Calendar"
      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.5 }]}
    >
      <View style={[styles.calBody, { borderColor: color }]}>
        <View style={[styles.calBar, { backgroundColor: color }]} />
        <View style={styles.calDots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.calDot, { backgroundColor: color }]} />
          ))}
        </View>
      </View>
    </Pressable>
  );
}

// Rounded two-or-more option switch, e.g. "RS UNS | Klinik".
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  role = 'tablist',
}: {
  items: { key: T; label: string; badge?: number }[];
  value: T;
  onChange: (key: T) => void;
  role?: 'tablist' | 'radiogroup';
}) {
  return (
    <View style={styles.segTrack} accessibilityRole={role}>
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            accessibilityRole={role === 'tablist' ? 'tab' : 'radio'}
            accessibilityState={role === 'tablist' ? { selected: active } : { checked: active }}
            style={[styles.seg, active && styles.segActive]}
          >
            <Text style={[styles.segText, active && styles.segTextActive]}>{it.label}</Text>
            {it.badge !== undefined && (
              <View style={[styles.segBadge, active && styles.segBadgeActive]}>
                <Text style={[styles.segBadgeText, active && styles.segBadgeTextActive]}>{it.badge}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

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

// Lowercase one-line wordmark.
export function Wordmark({ color = colors.accent, size = 26 }: { color?: string; size?: number }) {
  return (
    <Text
      accessibilityRole="header"
      accessibilityLabel="Patient Notes"
      numberOfLines={1}
      style={[styles.wordmark, { color, fontSize: size, lineHeight: size * 1.15 }]}
    >
      patient notes
    </Text>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
  },
  buttonText: { fontFamily: fonts.heading, fontSize: 17, letterSpacing: 0.2 },
  fieldLabel: { marginLeft: space.sm },
  input: {
    backgroundColor: colors.fill,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: radius.md,
    paddingHorizontal: space.lg + 2,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  inputFocused: { borderColor: colors.accent, backgroundColor: colors.surface },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, letterSpacing: 0.3 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 16, borderRadius: radius.pill },
  pillIcon: { fontSize: 16, fontFamily: fonts.bodyBlack, marginTop: -1 },
  pillText: { fontSize: 15, fontFamily: fonts.heading },
  round: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  roundGlyph: { color: '#fff', fontFamily: fonts.heading, textAlign: 'center' },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', gap: 2 },
  personHead: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.8 },
  personBody: { width: 22, height: 10, borderTopLeftRadius: 11, borderTopRightRadius: 11, borderWidth: 1.8, borderBottomWidth: 0 },
  calBody: { width: 22, height: 21, borderRadius: 5, borderWidth: 1.8, overflow: 'hidden' },
  calBar: { height: 4 },
  calDots: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, padding: 3, paddingTop: 3 },
  calDot: { width: 3, height: 3, borderRadius: 1.5 },
  segTrack: { flexDirection: 'row', backgroundColor: colors.fill, borderRadius: radius.pill, padding: 4 },
  seg: { flex: 1, flexDirection: 'row', gap: 6, height: 42, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segActive: { backgroundColor: colors.surface, ...shadow },
  segText: { fontFamily: fonts.headingSoft, fontSize: 16, color: colors.muted },
  segTextActive: { fontFamily: fonts.heading, color: colors.accent },
  segBadge: { minWidth: 22, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  segBadgeActive: { backgroundColor: colors.accentSoft },
  segBadgeText: { fontFamily: fonts.bodyBlack, fontSize: 11, color: colors.muted },
  segBadgeTextActive: { color: colors.accent },
  textAction: { fontSize: 15, fontFamily: fonts.bodyBold },
  banner: { backgroundColor: colors.dangerSoft, borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: space.md },
  bannerText: { color: colors.danger, fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyBold },
  wordmark: { fontFamily: fonts.display, letterSpacing: -0.5, textAlign: 'center' },
});
