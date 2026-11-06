import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../../App';
import { FACILITIES, facilityLabel, type Facility } from '../lib/types';
import { Button, ErrorBanner, Field, Segmented, type FieldRef } from '../ui/components';
import { colors, space, type } from '../ui/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientForm'>;

export default function PatientFormScreen({ navigation, route }: Props) {
  const existing = route.params?.patient;
  const [name, setName] = useState(existing?.name ?? '');
  const [number, setNumber] = useState(existing?.patient_number ?? '');
  const [facility, setFacility] = useState<Facility>(existing?.facility ?? route.params?.facility ?? 'rs_uns');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const numberRef = useRef<FieldRef>(null);
  const valid = !!name.trim() && !!number.trim();

  const save = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    const fields = { name: name.trim(), patient_number: number.trim(), facility };
    const { error } = existing
      ? await supabase.from('patients').update(fields).eq('id', existing.id)
      : await supabase.from('patients').insert(fields);
    setBusy(false);
    if (error) {
      setError(
        error.code === '23505' ? `A ${facilityLabel(facility)} patient with this number already exists.` : error.message,
      );
      return;
    }
    navigation.popToTop();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <View style={{ gap: 6 }}>
          <Text style={[type.label, styles.label]}>Place</Text>
          <Segmented items={FACILITIES} value={facility} onChange={setFacility} role="radiogroup" />
        </View>
        <Field
          label="Full name"
          placeholder="Jane Doe"
          value={name}
          onChangeText={setName}
          autoFocus={!existing}
          returnKeyType="next"
          onSubmitEditing={() => numberRef.current?.focus()}
        />
        <Field
          ref={numberRef}
          label="Patient number"
          placeholder="P-0001"
          value={number}
          onChangeText={setNumber}
          autoCapitalize="characters"
          returnKeyType="done"
          onSubmitEditing={save}
        />
        {error && <ErrorBanner message={error} />}
        <Button title={existing ? 'save changes' : 'add patient'} onPress={save} loading={busy} disabled={!valid} style={{ marginTop: space.sm }} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { padding: space.xl, gap: space.lg, width: '100%', maxWidth: 520, alignSelf: 'center' },
  label: { marginLeft: space.sm },
});
