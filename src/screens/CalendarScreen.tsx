import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { FACILITIES, facilityLabel, type Facility, type Patient } from '../lib/types';
import { addMonths, dayKey, longDay, monthGrid, monthTitle, startOfMonth, timeOf, WEEKDAYS } from '../lib/dates';
import type { RootStackParamList } from '../../App';
import { Avatar, ErrorBanner, Segmented } from '../ui/components';
import { cardEdge, colors, fonts, radius, shadow, space, type } from '../ui/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Calendar'>;
type Filter = 'all' | Facility;
type DayNote = { id: string; body: string; created_at: string; patient: Patient };

const FILTERS: { key: Filter; label: string }[] = [{ key: 'all', label: 'All' }, ...FACILITIES];

export default function CalendarScreen({ navigation }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => dayKey(new Date()));
  const [filter, setFilter] = useState<Filter>('all');
  const [notes, setNotes] = useState<DayNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const todayKey = dayKey(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    // Local month bounds, sent as exact instants.
    const from = startOfMonth(month).toISOString();
    const to = addMonths(month, 1).toISOString();
    const { data, error } = await supabase
      .from('notes')
      .select('id, body, created_at, patient:patients(id, name, patient_number, facility, created_at, updated_at)')
      .gte('created_at', from)
      .lt('created_at', to)
      .order('created_at', { ascending: true });
    if (error) setError(`Could not load notes: ${error.message}`);
    else {
      setError(null);
      setNotes((data as unknown as DayNote[]).filter((n) => n.patient));
    }
    setLoading(false);
  }, [month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const byDay = useMemo(() => {
    const map = new Map<string, DayNote[]>();
    for (const n of notes) {
      if (filter !== 'all' && n.patient.facility !== filter) continue;
      const k = dayKey(new Date(n.created_at));
      const list = map.get(k);
      if (list) list.push(n);
      else map.set(k, [n]);
    }
    return map;
  }, [notes, filter]);

  const cells = useMemo(() => monthGrid(month), [month]);
  const dayNotes = byDay.get(selected) ?? [];
  const selectedDate = new Date(`${selected}T00:00:00`);

  const goMonth = (n: number) => {
    const next = addMonths(month, n);
    setMonth(next);
    // Keep the selection inside the month being shown: today if it's there, else the 1st.
    const today = new Date();
    const pick = next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth() ? today : next;
    setSelected(dayKey(pick));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Segmented items={FILTERS} value={filter} onChange={setFilter} />

      <View style={styles.card}>
        <View style={styles.monthRow}>
          <MonthArrow label="‹" a11y="Previous month" onPress={() => goMonth(-1)} />
          <Text style={styles.monthTitle}>{monthTitle(month)}</Text>
          <MonthArrow label="›" a11y="Next month" onPress={() => goMonth(1)} />
        </View>

        <View style={styles.grid}>
          {WEEKDAYS.map((w) => (
            <View key={w} style={styles.cell}>
              <Text style={styles.weekday}>{w}</Text>
            </View>
          ))}
          {cells.map((d, i) => {
            if (!d) return <View key={`e${i}`} style={styles.cell} />;
            const k = dayKey(d);
            const count = byDay.get(k)?.length ?? 0;
            const isSelected = k === selected;
            const isToday = k === todayKey;
            return (
              <View key={k} style={styles.cell}>
                <Pressable
                  onPress={() => setSelected(k)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${longDay(d)}, ${count} ${count === 1 ? 'note' : 'notes'}`}
                  style={({ pressed }) => [
                    styles.day,
                    isToday && !isSelected && styles.dayToday,
                    isSelected && styles.daySelected,
                    pressed && { transform: [{ scale: 0.9 }] },
                  ]}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{d.getDate()}</Text>
                  <View style={[styles.dot, count > 0 && (isSelected ? styles.dotOnSelected : styles.dotOn)]} />
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      {error && <ErrorBanner message={error} />}

      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>{longDay(selectedDate)}</Text>
        {!loading && (
          <Text style={type.caption}>
            {dayNotes.length} {dayNotes.length === 1 ? 'note' : 'notes'}
          </Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: space.lg }} />
      ) : dayNotes.length === 0 ? (
        <Text style={[type.caption, styles.empty]}>No notes on this day.</Text>
      ) : (
        <View style={{ gap: space.md }}>
          {dayNotes.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => navigation.navigate('PatientDetail', { patient: n.patient })}
              style={({ pressed }) => [styles.note, pressed && { transform: [{ scale: 0.98 }] }]}
            >
              <View style={styles.noteHead}>
                <Avatar name={n.patient.name} seed={n.patient.id} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noteName} numberOfLines={1}>{n.patient.name}</Text>
                  <Text style={styles.noteMeta}>
                    {timeOf(n.created_at)}  ·  {facilityLabel(n.patient.facility)}  ·  #{n.patient.patient_number}
                  </Text>
                </View>
              </View>
              <Text style={[type.body, { marginTop: space.sm }]} numberOfLines={6}>{n.body}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function MonthArrow({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => [styles.arrow, pressed && { transform: [{ scale: 0.9 }] }]}
    >
      <Text style={styles.arrowText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.xl, paddingTop: space.sm, paddingBottom: 48, gap: space.lg, width: '100%', maxWidth: 640, alignSelf: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, ...shadow, ...cardEdge },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  monthTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink },
  arrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 24, color: colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  weekday: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.faint, paddingBottom: space.xs },
  day: { width: 40, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 3 },
  dayToday: { backgroundColor: colors.accentSoft },
  daySelected: { backgroundColor: colors.accent },
  dayText: { fontFamily: fonts.headingSoft, fontSize: 16, color: colors.ink },
  dayTextSelected: { fontFamily: fonts.heading, color: '#fff' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent' },
  dotOn: { backgroundColor: colors.accent },
  dotOnSelected: { backgroundColor: '#fff' },
  dayHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: space.sm },
  dayTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink },
  empty: { textAlign: 'center', marginTop: space.lg },
  note: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, ...shadow, ...cardEdge },
  noteHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  noteName: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink },
  noteMeta: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted, marginTop: 1 },
});
