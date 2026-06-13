import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { palette, spacing, font, radius } from '../theme';
import type { RootStackScreenProps } from '../navigation/types';

export function CameraScreen({ navigation }: RootStackScreenProps<'Camera'>) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const goAnalyze = (uri: string) => navigation.replace('Analyze', { photoUri: uri });

  const capture = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) goAnalyze(photo.uri);
    } finally {
      setBusy(false);
    }
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) goAnalyze(result.assets[0].uri);
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
        <Ionicons name="camera-outline" size={56} color={palette.textMuted} />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permBody}>
          Plately analyzes meal photos on your device. Grant camera access to snap a meal, or pick
          an existing photo instead.
        </Text>
        <Button label="Allow camera" onPress={() => void requestPermission()} />
        <Button label="Choose from library" variant="secondary" onPress={() => void pickFromLibrary()} />
        <Button label="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} accessibilityLabel="Close camera">
            <Ionicons name="close" size={26} color={palette.white} />
          </Pressable>
          <View style={styles.hintPill}>
            <Text style={styles.hintText}>Center your plate in frame</Text>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <Pressable onPress={() => void pickFromLibrary()} style={styles.iconBtn} accessibilityLabel="Pick from library">
            <Ionicons name="images" size={26} color={palette.white} />
          </Pressable>

          <Pressable
            onPress={() => void capture()}
            style={styles.shutterOuter}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
          >
            {busy ? <ActivityIndicator color={palette.black} /> : <View style={styles.shutterInner} />}
          </Pressable>

          <Pressable
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            style={styles.iconBtn}
            accessibilityLabel="Flip camera"
          >
            <Ionicons name="camera-reverse" size={26} color={palette.white} />
          </Pressable>
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
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: palette.white },
  permission: { flex: 1, backgroundColor: palette.bg, padding: spacing.xl, gap: spacing.md, justifyContent: 'center', alignItems: 'center' },
  permTitle: { color: palette.text, fontSize: font.size.xl, fontFamily: font.family.uiBold },
  permBody: { color: palette.textMuted, fontSize: font.size.md, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
});
