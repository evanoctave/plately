import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { BigRing } from '../components/Ring';
import { MacroBars } from '../components/MacroBars';
import { MicrosGrid } from '../components/MicrosGrid';
import { EntryRow } from '../components/EntryRow';
import { Card, SectionTitle } from '../components/Card';
import { spacing, font } from '../theme';
import type { Palette } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useSettings } from '../state/useSettings';
import { useDayLog } from '../state/useDiary';
import { prettyDay } from '../utils/date';
import { fmtInt } from '../utils/format';
import type { RootStackScreenProps } from '../navigation/types';

export function DayDetailScreen({ route }: RootStackScreenProps<'DayDetail'>) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  const { day } = route.params;
  const goals = useSettings((s) => s.goals);
  const { entries, totals } = useDayLog(day);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{prettyDay(day)}</Text>

      <Card style={styles.ringCard}>
        <BigRing
          progress={goals.calories > 0 ? totals.calories / goals.calories : 0}
          value={totals.calories}
          goal={goals.calories}
          label="Calories"
          unit="kcal"
        />
        <View style={styles.side}>
          <MacroBars protein={totals.protein} carbs={totals.carbs} fat={totals.fat} goals={goals} />
          <Text style={styles.water}>💧 {fmtInt(totals.water)} mL water</Text>
        </View>
      </Card>

      <SectionTitle>Entries</SectionTitle>
      <Card>
        {entries.length === 0 ? (
          <Text style={styles.empty}>No entries for this day.</Text>
        ) : (
          entries.map((entry, i) => (
            <View key={entry.id}>
              {i > 0 && <View style={styles.divider} />}
              <EntryRow entry={entry} />
            </View>
          ))
        )}
      </Card>

      {entries.length > 0 && (
        <>
          <SectionTitle>Micronutrients</SectionTitle>
          <MicrosGrid nutrition={totals} />
        </>
      )}
    </ScrollView>
  );
}

function makeStyles(p: Palette) {
  return StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    title: { color: p.text, fontSize: font.size.xxl, fontFamily: font.family.uiBold },
    ringCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    side: { flex: 1, gap: spacing.md },
    water: { color: p.water, fontSize: font.size.sm, fontFamily: font.family.mono },
    empty: { color: p.textMuted, fontSize: font.size.md, textAlign: 'center', paddingVertical: spacing.lg },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: p.border },
  });
}
