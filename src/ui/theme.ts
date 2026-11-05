import { Platform } from 'react-native';

export const colors = {
  background: '#F6F6F3',
  surface: '#FFFFFF',
  ink: '#1D1D1F',
  muted: '#8A8A8E',
  faint: '#B8B8BC',
  border: '#E7E7E3',
  accent: '#2F6B5F',
  accentSoft: '#E6EFEC',
  danger: '#C0453A',
  dangerSoft: '#FBECEA',
};

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const type = {
  display: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.6, color: colors.ink },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, color: colors.ink },
  body: { fontSize: 16, lineHeight: 23, color: colors.ink },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.muted, letterSpacing: 0.2 },
  caption: { fontSize: 13, color: colors.muted },
};

// Soft, low-contrast elevation for cards.
export const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 2 } },
  android: { elevation: 1 },
  default: { boxShadow: '0 2px 12px rgba(0,0,0,0.04)' },
}) as object;

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}
