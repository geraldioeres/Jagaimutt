import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import type { Patient } from '../lib/types';
import type { RootStackParamList } from '../../App';
import { Avatar, ErrorBanner, Field, Pill } from '../ui/components';
import { colors, radius, shadow, space, type } from '../ui/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientList'>;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function PatientListScreen({ navigation }: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('id, name, patient_number, created_at, updated_at')
      .order('updated_at', { ascending: false });
    if (error) setError(`Could not load patients: ${error.message}`);
    else {
      setError(null);
      setPatients(data as Patient[]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const insets = useSafeAreaInsets();

  // Filtering happens on the device, so user input never reaches a query string.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => p.name.toLowerCase().includes(q) || p.patient_number.toLowerCase().includes(q));
  }, [patients, query]);

  const header = (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Text style={styles.greeting}>{greeting()} 👋</Text>
        <Pill title="Sign out" onPress={() => supabase.auth.signOut()} />
      </View>
      <View style={styles.titleRow}>
        <Text style={type.display}>Patients</Text>
        <Pill title="New" icon="+" tone="accent" accessibilityLabel="New patient" onPress={() => navigation.navigate('PatientForm')} />
      </View>
      <Field
        placeholder="🔍  Search name or number"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
        style={styles.search}
      />
      {error && <ErrorBanner message={error} />}
      {!loading && filtered.length > 0 && (
        <View style={styles.count}>
          <Text style={styles.countText}>
            {filtered.length} {filtered.length === 1 ? 'patient' : 'patients'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      data={loading ? [] : filtered}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={header}
      refreshControl={
        <RefreshControl tintColor={colors.accent} refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: space.xxl }} />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{query ? '🔎' : '🌱'}</Text>
            <Text style={styles.emptyTitle}>{query ? 'No matches' : 'No patients yet'}</Text>
            <Text style={[type.caption, { textAlign: 'center' }]}>
              {query ? 'Try a different name or number.' : 'Tap New to add your first patient.'}
            </Text>
          </View>
        )
      }
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigation.navigate('PatientDetail', { patient: item })}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          <Avatar name={item.name} seed={item.id} size={46} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={type.caption}>#{item.patient_number}</Text>
          </View>
          <View style={styles.go}>
            <Text style={styles.goText}>›</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl, width: '100%', maxWidth: 640, alignSelf: 'center' },
  header: { gap: space.md, paddingBottom: space.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 15, fontWeight: '600', color: colors.muted },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.xs },
  search: { paddingVertical: 12, borderRadius: radius.pill, borderColor: 'transparent', backgroundColor: '#ECECE8' },
  count: { alignSelf: 'flex-start', marginTop: space.xs, backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { fontSize: 12, fontWeight: '700', color: colors.accent },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    paddingRight: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow,
  },
  rowPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  go: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  goText: { fontSize: 20, color: colors.muted, marginTop: -2, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 64, gap: space.xs },
  emptyEmoji: { fontSize: 44, marginBottom: space.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
});
