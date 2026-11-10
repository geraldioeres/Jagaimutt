import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { colors } from './theme';

// The app's sloth mascots. Each one has its own place:
//  - "love":      squeezes a heart, eyes shut with joy (login)
//  - "lock":      winks and goes "shh" while holding a padlock (lock screen)
//  - "clipboard": a nurse cheering with a clipboard (empty lists)
export type SlothKind = 'love' | 'lock' | 'clipboard';

const fur = '#B89377';
const furDark = '#9C785E';
const mask = '#F4E8DA';
const patch = '#6E5241';
const ink = '#3A2A20';
const blush = '#F5B5BF';
const heart = '#F28A9B';
const tongue = '#F59AA8';
const steel = '#7D8899';

const LABELS: Record<SlothKind, string> = {
  love: 'Happy sloth hugging a heart',
  lock: 'Sloth winking and saying shh, holding a padlock',
  clipboard: 'Nurse sloth cheering with a clipboard',
};

export function Sloth({ kind, size = 120 }: { kind: SlothKind; size?: number }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={LABELS[kind]} style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {kind === 'love' && <Love />}
        {kind === 'lock' && <Lock />}
        {kind === 'clipboard' && <Clipboard />}
      </Svg>
    </View>
  );
}

type EyeStyle = 'open' | 'happy' | 'closed';

function Eye({ x, y, look }: { x: number; y: number; look: EyeStyle }) {
  if (look === 'happy') {
    return <Path d={`M${x - 4} ${y + 1.5} q4 -5 8 0`} stroke={mask} strokeWidth={2.2} strokeLinecap="round" fill="none" />;
  }
  if (look === 'closed') {
    return <Path d={`M${x - 4} ${y} q4 3 8 0`} stroke={mask} strokeWidth={2.2} strokeLinecap="round" fill="none" />;
  }
  return (
    <G>
      <Circle cx={x} cy={y} r={3.8} fill={ink} />
      <Circle cx={x + 1.3} cy={y - 1.4} r={1.3} fill="#fff" />
      <Circle cx={x - 1.2} cy={y + 1.4} r={0.6} fill="#fff" />
    </G>
  );
}

// Shared head, tilted around the neck. Children are drawn in the head's
// tilted space (caps, paws over the mouth).
function Head({
  tilt = 0,
  left = 'open',
  right = 'open',
  mouth = 'smile',
  children,
}: {
  tilt?: number;
  left?: EyeStyle;
  right?: EyeStyle;
  mouth?: 'smile' | 'open' | 'none';
  children?: ReactNode;
}) {
  const y = 54;
  return (
    <G transform={`rotate(${tilt} 60 88)`}>
      <Circle cx={60} cy={y} r={34} fill={fur} />
      {/* fluffy tuft */}
      <Path d={`M52 ${y - 32} q4 -8 8 -2 q4 -7 8 1`} stroke={furDark} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Ellipse cx={60} cy={y + 4} rx={27} ry={22} fill={mask} />
      {/* droopy eye patches */}
      <Ellipse cx={47} cy={y + 2} rx={10} ry={6.5} fill={patch} transform={`rotate(-22 47 ${y + 2})`} />
      <Ellipse cx={73} cy={y + 2} rx={10} ry={6.5} fill={patch} transform={`rotate(22 73 ${y + 2})`} />
      <Eye x={49} y={y + 1} look={left} />
      <Eye x={71} y={y + 1} look={right} />
      <Ellipse cx={38} cy={y + 13} rx={6} ry={3.5} fill={blush} />
      <Ellipse cx={82} cy={y + 13} rx={6} ry={3.5} fill={blush} />
      <Ellipse cx={60} cy={y + 10} rx={4.5} ry={3} fill={ink} />
      {mouth === 'smile' && (
        <Path d={`M55 ${y + 16} q5 4 10 0`} stroke={ink} strokeWidth={1.8} strokeLinecap="round" fill="none" />
      )}
      {mouth === 'open' && (
        <G>
          <Path d={`M53.5 ${y + 15} Q60 ${y + 26} 66.5 ${y + 15} Z`} fill={ink} />
          <Ellipse cx={60} cy={y + 20.5} rx={3.5} ry={2} fill={tongue} />
        </G>
      )}
      {children}
    </G>
  );
}

function Body() {
  return (
    <G>
      <Ellipse cx={60} cy={102} rx={30} ry={17} fill={furDark} />
      <Ellipse cx={42} cy={114} rx={9} ry={5} fill={fur} />
      <Ellipse cx={78} cy={114} rx={9} ry={5} fill={fur} />
    </G>
  );
}

function Arm({ d }: { d: string }) {
  return <Path d={d} stroke={fur} strokeWidth={10} strokeLinecap="round" fill="none" />;
}

// A paw with three little claws pointing `up` or down.
function Paw({ x, y, up = false }: { x: number; y: number; up?: boolean }) {
  const dir = up ? -1 : 1;
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={7.5} ry={6.5} fill={fur} />
      <G stroke={mask} strokeWidth={1.8} strokeLinecap="round">
        <Path d={`M${x - 3.5} ${y + 2.5 * dir} v${3 * dir}`} />
        <Path d={`M${x} ${y + 3 * dir} v${3 * dir}`} />
        <Path d={`M${x + 3.5} ${y + 2.5 * dir} v${3 * dir}`} />
      </G>
    </G>
  );
}

function SmallHeart({ x, y, s, opacity = 1 }: { x: number; y: number; s: number; opacity?: number }) {
  return (
    <Path
      d={`M${x} ${y + s} C${x - s * 1.4} ${y + s * 0.2} ${x - s} ${y - s * 0.9} ${x} ${y - s * 0.2} C${x + s} ${y - s * 0.9} ${x + s * 1.4} ${y + s * 0.2} ${x} ${y + s} Z`}
      fill={heart}
      opacity={opacity}
    />
  );
}

function Sparkle({ x, y, s, color = colors.accent }: { x: number; y: number; s: number; color?: string }) {
  return (
    <Path
      d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`}
      fill={color}
    />
  );
}

function Love() {
  return (
    <G>
      <Body />
      <Head tilt={-12} left="happy" right="happy" mouth="open" />
      {/* squeezed heart */}
      <G transform="rotate(8 60 100)">
        <Path d="M60 117 C37 103 35 86 48 84 C54 83 58 87 60 91 C62 87 66 83 72 84 C85 86 83 103 60 117 Z" fill={heart} />
        <Path d="M47 90 q2 -3 5 -2" stroke="#fff" strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.8} />
      </G>
      <Arm d="M32 90 Q34 100 42 101" />
      <Arm d="M88 90 Q88 100 79 102" />
      <Paw x={44} y={101} />
      <Paw x={78} y={102} />
      {/* squeeze lines + floating hearts */}
      <G stroke={heart} strokeWidth={2.2} strokeLinecap="round">
        <Path d="M22 96 l-6 -2" />
        <Path d="M23 104 l-6 2" />
        <Path d="M98 96 l6 -2" />
        <Path d="M97 104 l6 2" />
      </G>
      <SmallHeart x={96} y={24} s={7} />
      <SmallHeart x={108} y={8} s={4.5} opacity={0.6} />
      <SmallHeart x={20} y={22} s={4} opacity={0.5} />
    </G>
  );
}

function Lock() {
  return (
    <G>
      <Body />
      {/* padlock held low on the left */}
      <Path d="M42 92 v-7 a9 9 0 0 1 18 0 v7" stroke={colors.accentDeep} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Rect x={34} y={90} width={34} height={25} rx={7} fill={colors.accent} />
      <Circle cx={51} cy={100} r={3.2} fill="#fff" />
      <Rect x={49.8} y={100} width={2.4} height={6} rx={1.2} fill="#fff" />
      <Paw x={32} y={103} />
      {/* arm raised to the mouth */}
      <Arm d="M86 98 Q90 86 68 81" />
      <Head tilt={9} left="closed" right="open" mouth="none">
        {/* "shh" finger over the mouth */}
        <Path d="M60 80 L60 67" stroke={fur} strokeWidth={4.5} strokeLinecap="round" />
        <Ellipse cx={61} cy={81} rx={6.5} ry={5} fill={fur} />
        <Path d="M60 67.5 v2" stroke={mask} strokeWidth={1.6} strokeLinecap="round" />
      </Head>
      {/* shh waves */}
      <G stroke={colors.accent} strokeWidth={2.2} strokeLinecap="round" fill="none">
        <Path d="M100 64 q4 4 0 8" />
        <Path d="M106 60 q6 8 0 16" opacity={0.6} />
      </G>
      <Sparkle x={22} y={26} s={6} />
    </G>
  );
}

function Clipboard() {
  return (
    <G>
      <Body />
      {/* cheering arm, up high */}
      <Arm d="M84 92 Q100 76 98 50" />
      <Paw x={98} y={46} up />
      <Head tilt={-8} left="open" right="open" mouth="open">
        {/* nurse cap */}
        <Path d="M42 26 L47 11 Q60 7 73 11 L78 26 Q60 21 42 26 Z" fill="#fff" stroke={colors.border} strokeWidth={1.5} />
        <Rect x={57.5} y={12} width={5} height={11} rx={1.2} fill={colors.accent} />
        <Rect x={54.5} y={15} width={11} height={5} rx={1.2} fill={colors.accent} />
      </Head>
      {/* stethoscope around the neck */}
      <Path d="M40 82 Q60 96 80 82" stroke={steel} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <Path d="M80 82 q6 8 2 18" stroke={steel} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <Circle cx={82} cy={102} r={4.5} fill="#fff" stroke={steel} strokeWidth={2.6} />
      {/* clipboard tucked under the other arm */}
      <G transform="rotate(-10 50 100)">
        <Rect x={34} y={86} width={30} height={30} rx={4} fill="#fff" stroke={colors.border} strokeWidth={1.5} />
        <Rect x={42} y={83} width={14} height={6} rx={2} fill={colors.accent} />
        <G stroke={colors.faint} strokeWidth={2} strokeLinecap="round">
          <Path d="M40 96 h18" />
          <Path d="M40 102 h18" />
          <Path d="M40 108 h11" />
        </G>
        <Path d="M51 108 l3 3 l6 -7" stroke={colors.accent} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
      <Paw x={36} y={104} />
      <Sparkle x={108} y={24} s={6} />
      <Sparkle x={84} y={20} s={3.5} color={heart} />
      <Sparkle x={16} y={40} s={4} />
    </G>
  );
}
