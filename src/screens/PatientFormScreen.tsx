import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientForm'>;

export default function PatientFormScreen({ navigation, route }: Props) {
  const existing = route.params?.patient;
  const [name, setName] = useState(existing?.name ?? '');
  const [number, setNumber] = useState(existing?.patient_number ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    const fields = { name: name.trim(), patient_number: number.trim() };
    const { error } = existing
      ? await supabase.from('patients').update(fields).eq('id', existing.id)
      : await supabase.from('patients').insert(fields);
    setBusy(false);
    if (error) {
      setError(error.code === '23505' ? 'A patient with this number already exists.' : error.message);
      return;
    }
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Patient number"
        value={number}
        onChangeText={setNumber}
        autoCapitalize="characters"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={[styles.button, busy && { opacity: 0.6 }]} onPress={save} disabled={busy || !name.trim() || !number.trim()}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  error: { color: '#b00020' },
  button: { backgroundColor: '#0a6cff', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

