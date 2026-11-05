import { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import type { Note } from '../lib/types';
import type { RootStackParamList } from '../../App';
import { Avatar, Button, ErrorBanner, TextAction } from '../ui/components';
import { colors, radius, shadow, space, type } from '../ui/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientDetail'>;

function formatDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
}

export default function PatientDetailScreen({ navigation, route }: Props) {
  const { patient } = route.params;
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('id, patient_id, body, created_at, updated_at')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false });
    if (error) setError(`Could not load notes: ${error.message}`);
    else {
      setError(null);
      setNotes(data as Note[]);
    }
    setLoading(false);
  }, [patient.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmDeletePatient = useCallback(() => {
    Alert.alert('Delete patient', `Delete ${patient.name} and all of their notes? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('patients').delete().eq('id', patient.id);
          if (error) Alert.alert('Error', error.message);
          else navigation.popToTop();
        },
      },
    ]);
  }, [navigation, patient]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <TextAction title="Edit" onPress={() => navigation.navigate('PatientForm', { patient })} />,
    });
  }, [navigation, patient]);

  const saveNote = async () => {
    setBusy(true);
    setError(null);
    const body = draft.trim();
    const { error } = editingId
      ? await supabase.from('notes').update({ body }).eq('id', editingId)
      : await supabase.from('notes').insert({ patient_id: patient.id, body });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDraft('');
    setEditingId(null);
    load();
  };

  const confirmDeleteNote = (note: Note) => {
    Alert.alert('Delete note', 'Delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('notes').delete().eq('id', note.id);
          if (error) setError(error.message);
          else load();
        },
      },
    ]);
  };

  const header = (
    <View style={{ gap: space.lg }}>
      <View style={styles.profile}>
        <Avatar name={patient.name} size={64} />
        <Text style={[type.title, { marginTop: space.md, textAlign: 'center' }]}>{patient.name}</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>#{patient.patient_number}</Text>
        </View>
      </View>

      <View style={[styles.composer, focused && styles.composerFocused]}>
        {editingId && <Text style={[type.label, { marginBottom: space.xs }]}>EDITING NOTE</Text>}
        <TextInput
          style={styles.input}
          placeholder="Write a note…"
          placeholderTextColor={colors.faint}
          selectionColor={colors.accent}
          value={draft}
          onChangeText={setDraft}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline
        />
        <View style={styles.composerButtons}>
          {editingId && <TextAction title="Cancel" tone="muted" onPress={() => { setEditingId(null); setDraft(''); }} />}
          <Button
            title={editingId ? 'Update' : 'Add note'}
            onPress={saveNote}
            loading={busy}
            disabled={!draft.trim()}
            style={styles.composerButton}
          />
        </View>
      </View>

      {error && <ErrorBanner message={error} />}

      {!loading && notes.length > 0 && (
        <Text style={[type.label, { marginTop: space.sm, marginLeft: space.xs }]}>
          {notes.length} {notes.length === 1 ? 'NOTE' : 'NOTES'}
        </Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <FlatList
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        data={loading ? [] : notes}
        keyExtractor={(n) => n.id}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        ListHeaderComponentStyle={{ marginBottom: space.md }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: space.xl }} />
          ) : (
            <Text style={[type.caption, styles.empty]}>No notes yet.</Text>
          )
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <TextAction title="Delete patient" tone="danger" onPress={confirmDeletePatient} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.note, editingId === item.id && styles.noteEditing]}>
            <Text style={type.caption}>
              {formatDate(item.created_at)}
              {item.updated_at !== item.created_at ? '  ·  edited' : ''}
            </Text>
            <Text style={[type.body, { marginTop: space.sm }]}>{item.body}</Text>
            <View style={styles.noteActions}>
              <TextAction title="Edit" tone="muted" onPress={() => { setEditingId(item.id); setDraft(item.body); }} />
              <TextAction title="Delete" tone="muted" onPress={() => confirmDeleteNote(item)} />
            </View>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, paddingBottom: space.xxl, width: '100%', maxWidth: 640, alignSelf: 'center' },
  profile: { alignItems: 'center', paddingTop: space.sm, paddingBottom: space.sm },
  chip: { marginTop: space.sm, backgroundColor: '#ECECE8', borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.muted, letterSpacing: 0.3 },
  composer: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: 'transparent', ...shadow },
  composerFocused: { borderColor: colors.accent },
  input: { fontSize: 16, lineHeight: 23, color: colors.ink, minHeight: 72, textAlignVertical: 'top', padding: 0 },
  composerButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: space.lg, marginTop: space.md },
  composerButton: { height: 40, borderRadius: radius.pill, paddingHorizontal: space.lg },
  note: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: 'transparent', ...shadow },
  noteEditing: { borderColor: colors.accent },
  noteActions: { flexDirection: 'row', gap: space.xl, marginTop: space.md },
  empty: { textAlign: 'center', marginTop: space.xl },
  footer: { alignItems: 'center', marginTop: space.xxl },
});
