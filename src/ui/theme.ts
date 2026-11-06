import { Platform } from 'react-native';

export const colors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  fill: '#F3F6FB', // inputs and quiet chips on white
  accentDeep: '#5C85C4', // big headlines
  ink: '#3F4A5C',
  muted: '#8D98AA',
  faint: '#C2CBD8',
  border: '#E3EAF4',
  accent: '#6F98D6',
  accentSoft: '#E5EEFA',
  danger: '#E0707F',
  dangerSoft: '#FCEBEE',
};

// Loaded in App.tsx with useFonts. Custom fonts carry their own weight, so styles
// pick a family instead of setting fontWeight.
export const fonts = {
  display: 'Fredoka_700Bold',
  heading: 'Fredoka_600SemiBold',
  headingSoft: 'Fredoka_500Medium',
  body: 'Nunito_500Medium',
  bodyBold: 'Nunito_700Bold',
  bodyBlack: 'Nunito_800ExtraBold',
};

export const radius = { sm: 12, md: 18, lg: 28, xl: 36, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 34, lineHeight: 36, color: colors.accentDeep, textTransform: 'uppercase' as const },
  display: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.ink, textTransform: 'uppercase' as const },
  title: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.ink },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted, letterSpacing: 0.2 },
  caption: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
};

// Soft, blue-tinted elevation so white cards still lift off a white screen.
export const shadow = Platform.select({
  ios: { shadowColor: '#4A6FA5', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  android: { elevation: 3, shadowColor: '#4A6FA5' },
  default: { boxShadow: '0 6px 20px rgba(74,111,165,0.12)' },
}) as object;

// Thin outline paired with the shadow on cards.
export const cardEdge = { borderWidth: 1, borderColor: '#EDF1F7' };

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}

// Soft baby-toned pairs for avatars; each patient keeps the same color.
const avatarPalette = [
  { bg: '#E3EDFB', fg: '#5C85C4' }, // blue
  { bg: '#FBE5EA', fg: '#C9607A' }, // pink
  { bg: '#E2F4EE', fg: '#4C9A83' }, // mint
  { bg: '#FBF2D9', fg: '#B08A2E' }, // butter
  { bg: '#EEE7FA', fg: '#7D63BF' }, // lavender
  { bg: '#FDEBDF', fg: '#C27547' }, // peach
];

export function avatarColors(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return avatarPalette[Math.abs(h) % avatarPalette.length];
}
