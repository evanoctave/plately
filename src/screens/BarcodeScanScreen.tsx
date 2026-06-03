import { useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { palette, spacing, font, radius } from '../theme';
import { lookupBarcode } from '../data/openFoodFacts';
import { registerTransientFood } from '../data/catalog';
import type { RootStackScreenProps } from '../navigation/types';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] as const;

type Phase = 'scanning' | 'looking_up' | 'not_found' | 'error';

export function BarcodeScanScreen({ navigation }: RootStackScreenProps<'BarcodeScan'>) {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('scanning');
  const [lastCode, setLastCode] = useState<string | null>(null);
  // Guard so we only process one scan at a time.
  const busy = useRef(false);

  const handleScan = async (result: BarcodeScanningResult) => {
    if (busy.current || phase === 'looking_up') return;
    const code = result.data?.trim();
    if (!code) return;

    busy.current = true;
    setLastCode(code);
    setPhase('looking_up');

    const lookup = await lookupBarcode(code);
    if (lookup.status === 'found') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      registerTransientFood(lookup.food);
      navigation.replace('ConfirmFood', {
        foodId: lookup.food.id,
        source: 'search',
        suggestedGrams: lookup.food.servingGrams,
      });
      return;
    }
    setPhase(lookup.status === 'not_found' ? 'not_found' : 'error');
    busy.current = false;
  };

  const rescan = () => {
    busy.current = false;
    setLastCode(null);
    setPhase('scanning');
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.green} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permission}>
        <Ionicons name="barcode-outline" size={56} color={palette.textMuted} />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permBody}>
          Allow camera access to scan a product barcode. Lookups use the free, open
          Open Food Facts database.
        </Text>
        <Button label="Allow camera" onPress={() => void requestPermission()} />
        <Button label="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        onBarcodeScanned={phase === 'scanning' ? (r) => void handleScan(r) : undefined}
      />
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} accessibilityLabel="Close scanner">
            <Ionicons name="close" size={26} color={palette.white} />
          </Pressable>
          <View style={styles.hintPill}>
            <Text style={styles.hintText}>Point at a barcode</Text>
          </View>
        </View>

        <View style={styles.frame} />

        <View style={styles.bottom}>
          {phase === 'looking_up' && (
            <View style={styles.statusCard}>
              <ActivityIndicator color={palette.green} />
              <Text style={styles.statusText}>Looking up {lastCode}…</Text>
            </View>
          )}
          {phase === 'not_found' && (
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>Not in the database</Text>
              <Text style={styles.statusText}>
                This product isn’t in Open Food Facts yet. Try again or add it as a custom food.
              </Text>
              <View style={styles.statusButtons}>
                <Button label="Scan again" variant="secondary" onPress={rescan} />
                <Button label="Add custom" onPress={() => navigation.replace('AddCustomFood')} />
              </View>
            </View>
          )}
          {phase === 'error' && (
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>Couldn’t connect</Text>
              <Text style={styles.statusText}>
                Barcode lookup needs internet. Check your connection and try again.
              </Text>
              <Button label="Scan again" variant="secondary" onPress={rescan} />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.black },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  hintPill: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  hintText: { color: palette.white, fontSize: font.size.sm },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    alignSelf: 'center',
    width: '78%',
    height: 160,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: radius.lg,
  },
  bottom: { padding: spacing.lg, gap: spacing.md, minHeight: 80 },
  statusCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  statusTitle: { color: palette.text, fontSize: font.size.lg, fontWeight: font.weight.semibold },
  statusText: { color: palette.textMuted, fontSize: font.size.sm, textAlign: 'center', lineHeight: 18 },
  statusButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  permission: {
    flex: 1,
    backgroundColor: palette.bg,
    padding: spacing.xl,
    gap: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permTitle: { color: palette.text, fontSize: font.size.xl, fontWeight: font.weight.bold },
  permBody: {
    color: palette.textMuted,
    fontSize: font.size.md,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
});
