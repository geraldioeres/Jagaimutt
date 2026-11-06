import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import type { Patient } from '../lib/types';
import type { RootStackParamList } from '../../App';
import { Avatar, ErrorBanner, Field, PersonButton, RoundButton, Tabs, Wordmark } from '../ui/components';
import { cardEdge, colors, fonts, radius, shadow, space, type } from '../ui/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientList'>;
type Sort = 'recent' | 'az';

const SORTS: { key: Sort; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'az', label: 'A–Z' },
];

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

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

  // Filtering happens on the device, so user input never reaches a query string.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? patients.filter((p) => p.name.toLowerCase().includes(q) || p.patient_number.toLowerCase().includes(q))
      : patients;
    return sort === 'az' ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : list;
  }, [patients, query, sort]);

  const header = (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <View style={styles.topSide} />
        <Wordmark color={colors.accent} size={22} />
        <View style={[styles.topSide, { alignItems: 'flex-end' }]}>
          <PersonButton onPress={confirmSignOut} />
        </View>
      </View>

      <Text style={type.display}>Your patients</Text>

      <Tabs items={SORTS} value={sort} onChange={setSort} />

      <Field
        placeholder="Search name or number"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
        style={styles.search}
      />
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
              <Text style={styles.emptyTitle}>{query ? 'No matches' : 'No patients yet'}</Text>
              <Text style={[type.caption, { textAlign: 'center' }]}>
                {query ? 'Try a different name or number.' : 'Tap the + button to add your first patient.'}
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
        accessibilityLabel="New patient"
        onPress={() => navigation.navigate('PatientForm')}
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
  topSide: { width: 44 },
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
