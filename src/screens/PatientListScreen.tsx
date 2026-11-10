import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, AppState, FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { fullDate, weekdayName } from '../lib/dates';
import { FACILITIES, facilityLabel, type Facility, type Patient } from '../lib/types';
import type { RootStackParamList } from '../../App';
import { Avatar, CalendarButton, ErrorBanner, Field, PersonButton, Pill, RoundButton, Segmented, Wordmark } from '../ui/components';
import { cardEdge, colors, fonts, radius, shadow, space, type } from '../ui/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientList'>;
type Sort = 'recent' | 'az';

// Remembers which place's tab was open last time.
const FACILITY_KEY = 'patientList.facility';

function confirmSignOut() {
  // Alert has no buttons on web, so use the browser's confirm there.
  if (Platform.OS === 'web') {
    if (window.confirm('Sign out of Patient Notes?')) supabase.auth.signOut();
    return;
  }
  Alert.alert('Sign out', 'Sign out of Patient Notes?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
  ]);
}

export default function PatientListScreen({ navigation }: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const [facility, setFacility] = useState<Facility>('rs_uns');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('id, name, patient_number, facility, created_at, updated_at')
      .order('updated_at', { ascending: false });
    if (error) setError(`Could not load patients: ${error.message}`);
    else {
      setError(null);
      setPatients(data as Patient[]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  // Today's date for the header. Refreshed when the screen regains focus or the
  // app comes back to the foreground, so it rolls over after midnight.
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(useCallback(() => { load(); setNow(new Date()); }, [load]));
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setNow(new Date());
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(FACILITY_KEY)
      .then((saved) => {
        if (saved && FACILITIES.some((f) => f.key === saved)) setFacility(saved as Facility);
      })
      .catch(() => {});
  }, []);

  const changeFacility = (f: Facility) => {
    setFacility(f);
    AsyncStorage.setItem(FACILITY_KEY, f).catch(() => {});
  };

  const counts = useMemo(() => {
    const c: Record<Facility, number> = { rs_uns: 0, klinik: 0 };
    for (const p of patients) c[p.facility] = (c[p.facility] ?? 0) + 1;
    return c;
  }, [patients]);

  // Filtering happens on the device, so user input never reaches a query string.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const here = patients.filter((p) => p.facility === facility);
    const list = q
      ? here.filter((p) => p.name.toLowerCase().includes(q) || p.patient_number.toLowerCase().includes(q))
      : here;
    return sort === 'az' ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : list;
  }, [patients, facility, query, sort]);

  const header = (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <View style={styles.topSide}>
          <CalendarButton onPress={() => navigation.navigate('Calendar')} />
        </View>
        <Wordmark color={colors.accent} size={22} />
        <View style={[styles.topSide, { alignItems: 'flex-end' }]}>
          <PersonButton onPress={confirmSignOut} />
        </View>
      </View>

      <Pressable
        onPress={() => navigation.navigate('Calendar')}
        accessibilityRole="button"
        accessibilityLabel={`Today is ${weekdayName(now)}, ${fullDate(now)}. Open calendar`}
        style={({ pressed }) => [styles.today, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.todayWeekday}>{weekdayName(now)}</Text>
        <Text style={styles.todayDate}>{fullDate(now)}</Text>
      </Pressable>

      <Segmented
        items={FACILITIES.map((f) => ({ ...f, badge: loading ? undefined : counts[f.key] }))}
        value={facility}
        onChange={changeFacility}
      />

      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <Field
            placeholder="Search name or number"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
            style={styles.search}
          />
        </View>
        <Pill
          title={sort === 'recent' ? 'Recent' : 'A–Z'}
          icon="⇅"
          accessibilityLabel={sort === 'recent' ? 'Sorted by recent. Sort A to Z' : 'Sorted A to Z. Sort by recent'}
          onPress={() => setSort(sort === 'recent' ? 'az' : 'recent')}
        />
      </View>
      {error && <ErrorBanner message={error} />}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        data={loading ? [] : visible}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        refreshControl={
          <RefreshControl tintColor={colors.accent} refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: space.xxl }} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{query ? 'No matches' : `No ${facilityLabel(facility)} patients yet`}</Text>
              <Text style={[type.caption, { textAlign: 'center' }]}>
                {query ? 'Try a different name or number.' : 'Tap the + button to add one.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('PatientDetail', { patient: item })}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <Avatar name={item.name} seed={item.id} size={54} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.number}>#{item.patient_number}</Text>
            </View>
            <View style={styles.go}>
              <Text style={styles.goText}>›</Text>
            </View>
          </Pressable>
        )}
      />

      <RoundButton
        glyph="+"
        size={62}
        accessibilityLabel={`New ${facilityLabel(facility)} patient`}
        onPress={() => navigation.navigate('PatientForm', { facility })}
        style={[styles.fab, { bottom: insets.bottom + space.xl }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.xl, width: '100%', maxWidth: 640, alignSelf: 'center' },
  header: { gap: space.lg, paddingBottom: space.lg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  today: { alignSelf: 'flex-start' },
  todayWeekday: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },
  todayDate: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 22, color: colors.ink },
  topSide: { width: 44 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  search: { borderRadius: radius.pill },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow,
    ...cardEdge,
  },
  cardPressed: { transform: [{ scale: 0.98 }] },
  name: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink, marginBottom: 2 },
  number: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted },
  go: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  goText: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 24, color: colors.accent, marginLeft: 2 },
  empty: { alignItems: 'center', marginTop: 56, gap: space.xs },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.ink },
  fab: { position: 'absolute', right: space.xl },
});
