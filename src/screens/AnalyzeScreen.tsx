import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { palette, spacing, font, radius } from '../theme';
import { classifyImage, getModelStatus, loadModel, type Prediction } from '../ml/recognizer';
import type { RootStackScreenProps } from '../navigation/types';

export function AnalyzeScreen({ route, navigation }: RootStackScreenProps<'Analyze'>) {
  const { photoUri } = route.params;
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [modelMissing, setModelMissing] = useState(false);
  const [downloadPct, setDownloadPct] = useState<number | null>(null);

  const analyze = useCallback(async () => {
    setLoading(true);
    const results = await classifyImage(photoUri, 3);
    setPredictions(results);
    setModelMissing(results.length === 0 && getModelStatus() !== 'ready');
    setLoading(false);
  }, [photoUri]);

  const downloadAndRetry = useCallback(async () => {
    setModelMissing(false);
    setDownloadPct(0);
    await loadModel((f) => setDownloadPct(Math.round(f * 100)));
    setDownloadPct(null);
    await analyze();
  }, [analyze]);

  useEffect(() => {
    let active = true;
    (async () => {
      const results = await classifyImage(photoUri, 3);
      if (!active) return;
      setPredictions(results);
      setModelMissing(results.length === 0 && getModelStatus() !== 'ready');
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [photoUri]);

  const choose = (p: Prediction) => {
    if (p.food) {
      navigation.replace('ConfirmFood', {
        foodId: p.food.id,
        photoUri,
        source: 'photo',
        suggestedGrams: p.food.servingGrams,
      });
    } else {
      // No curated match — jump to search pre-context.
      navigation.replace('Search');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" transition={150} />

      {downloadPct !== null ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator color={palette.green} />
          <Text style={styles.loadingText}>Downloading model… {downloadPct}%</Text>
          <Text style={styles.noticeBody}>One-time download. Then it works fully offline.</Text>
        </Card>
      ) : loading ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator color={palette.green} />
          <Text style={styles.loadingText}>Analyzing on your device…</Text>
        </Card>
      ) : modelMissing ? (
        <Card style={styles.notice}>
          <Ionicons name="cloud-download-outline" size={28} color={palette.amber} />
          <Text style={styles.noticeTitle}>On-device model not ready</Text>
          <Text style={styles.noticeBody}>
            The recognition model fetches once over the network, then works offline and private.
            Download it now to identify this meal, or add it by searching.
          </Text>
          <Button label="Download model & retry" onPress={() => void downloadAndRetry()} />
          <Button
            label="Search instead"
            variant="secondary"
            onPress={() => navigation.replace('Search')}
          />
        </Card>
      ) : predictions.length === 0 ? (
        <Card style={styles.notice}>
          <Ionicons name="help-circle-outline" size={28} color={palette.textMuted} />
          <Text style={styles.noticeTitle}>Couldn’t identify the food</Text>
          <Text style={styles.noticeBody}>No confident match. Try searching for it instead.</Text>
          <Button label="Search for this food" onPress={() => navigation.replace('Search')} />
        </Card>
      ) : (
        <View style={styles.results}>
          <Text style={styles.heading}>Is this your meal?</Text>
          {predictions.map((p) => (
            <Pressable
              key={p.label}
              onPress={() => choose(p)}
              style={({ pressed }) => [styles.prediction, pressed && styles.pressed]}
            >
              <View style={styles.predLeft}>
                <Text style={styles.predName}>{p.food?.name ?? p.displayName}</Text>
                <Text style={styles.predMeta}>
                  {Math.round(p.confidence * 100)}% match
                  {p.food ? '' : ' · tap to search'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.textFaint} />
            </Pressable>
          ))}
          <Button
            label="None of these — search"
            variant="secondary"
            onPress={() => navigation.replace('Search')}
          />
        </View>
      )}

      <Text style={styles.disclaimer}>
        Estimates are approximate. Adjust the portion on the next screen for accuracy.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  photo: { width: '100%', height: 240, borderRadius: radius.lg, backgroundColor: palette.surfaceAlt },
  loadingCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  loadingText: { color: palette.textMuted, fontSize: font.size.md },
  notice: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  noticeTitle: { color: palette.text, fontSize: font.size.lg, fontFamily: font.family.uiSemibold },
  noticeBody: { color: palette.textMuted, fontSize: font.size.md, textAlign: 'center', lineHeight: 20 },
  results: { gap: spacing.md },
  heading: { color: palette.text, fontSize: font.size.xl, fontFamily: font.family.uiBold },
  prediction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  pressed: { opacity: 0.7 },
  predLeft: { gap: 2 },
  predName: { color: palette.text, fontSize: font.size.lg, fontFamily: font.family.uiSemibold },
  predMeta: { color: palette.textMuted, fontSize: font.size.sm },
  disclaimer: { color: palette.textFaint, fontSize: font.size.xs, textAlign: 'center', lineHeight: 16 },
});
