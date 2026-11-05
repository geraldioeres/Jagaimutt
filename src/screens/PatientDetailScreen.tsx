import { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import type { Note } from '../lib/types';
import type { RootStackParamList } from '../../App';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientDetail'>;

export default function PatientDetailScreen({ navigation, route }: Props) {
  const { patient } = route.params;
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
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
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Pressable onPress={() => navigation.navigate('PatientForm', { patient })}>
            <Text style={styles.link}>Edit</Text>
          </Pressable>
          <Pressable onPress={confirmDeletePatient}>
            <Text style={[styles.link, { color: '#b00020' }]}>Delete</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, patient, confirmDeletePatient]);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{patient.name}</Text>
        <Text style={styles.number}>#{patient.patient_number}</Text>
      </View>

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder={editingId ? 'Edit note' : 'New note'}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <View style={styles.composerButtons}>
          {editingId && (
            <Pressable onPress={() => { setEditingId(null); setDraft(''); }}>
              <Text style={styles.link}>Cancel</Text>
            </Pressable>
          )}
          <Pressable style={[styles.button, (busy || !draft.trim()) && { opacity: 0.5 }]} onPress={saveNote} disabled={busy || !draft.trim()}>
            <Text style={styles.buttonText}>{editingId ? 'Update' : 'Add note'}</Text>
          </Pressable>
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(n) => n.id}
          ListEmptyComponent={<Text style={styles.empty}>No notes yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.note}>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleString()}
                {item.updated_at !== item.created_at ? ' (edited)' : ''}
              </Text>
              <Text style={styles.body}>{item.body}</Text>
              <View style={styles.noteActions}>
                <Pressable onPress={() => { setEditingId(item.id); setDraft(item.body); }}>
                  <Text style={styles.link}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => confirmDeleteNote(item)}>
                  <Text style={[styles.link, { color: '#b00020' }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' },
  name: { fontSize: 20, fontWeight: '700' },
  number: { color: '#666', marginTop: 2 },
  composer: { padding: 12, gap: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
  composerButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  button: { backgroundColor: '#0a6cff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  note: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' },
  date: { color: '#666', fontSize: 12 },
  body: { fontSize: 16, marginTop: 4 },
  noteActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  link: { color: '#0a6cff', fontSize: 15 },
  empty: { textAlign: 'center', marginTop: 24, color: '#666' },
  error: { color: '#b00020', marginHorizontal: 12 },
});

