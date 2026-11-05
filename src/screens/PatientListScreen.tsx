import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import type { Patient } from '../lib/types';
import type { RootStackParamList } from '../../App';
import { Avatar, ErrorBanner, Field, TextAction } from '../ui/components';
import { colors, radius, space, type } from '../ui/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientList'>;

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <TextAction title="Sign out" tone="muted" onPress={() => supabase.auth.signOut()} />,
      headerRight: () => <TextAction title="New" onPress={() => navigation.navigate('PatientForm')} />,
    });
  }, [navigation]);

  // Filtering happens on the device, so user input never reaches a query string.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => p.name.toLowerCase().includes(q) || p.patient_number.toLowerCase().includes(q));
  }, [patients, query]);

  const header = (
    <View style={styles.header}>
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
      {!loading && filtered.length > 0 && (
        <Text style={[type.label, styles.count]}>
          {filtered.length} {filtered.length === 1 ? 'PATIENT' : 'PATIENTS'}
        </Text>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
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
            <Text style={styles.emptyTitle}>{query ? 'No matches' : 'No patients yet'}</Text>
            <Text style={[type.caption, { textAlign: 'center' }]}>
              {query ? 'Try a different name or number.' : 'Tap New to add your first patient.'}
            </Text>
          </View>
        )
      }
      renderItem={({ item, index }) => {
        const first = index === 0;
        const last = index === filtered.length - 1;
        return (
          <Pressable
            onPress={() => navigation.navigate('PatientDetail', { patient: item })}
            style={({ pressed }) => [
              styles.row,
              first && styles.rowFirst,
              last && styles.rowLast,
              pressed && { backgroundColor: '#FAFAF8' },
            ]}
          >
            <Avatar name={item.name} />
            <View style={[styles.rowText, !last && styles.rowDivider]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={type.caption}>#{item.patient_number}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  header: { gap: space.md, paddingTop: space.sm, paddingBottom: space.sm },
  search: { paddingVertical: 11, borderRadius: radius.pill, borderColor: 'transparent', backgroundColor: '#ECECE8' },
  count: { marginTop: space.sm, marginLeft: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: space.lg, backgroundColor: colors.surface },
  rowFirst: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  rowLast: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
  rowText: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingRight: space.lg, gap: space.sm },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  name: { fontSize: 16, fontWeight: '600', color: colors.ink, marginBottom: 2 },
  chevron: { fontSize: 24, color: colors.faint, marginTop: -2 },
  empty: { alignItems: 'center', marginTop: 72, gap: space.xs },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
});
