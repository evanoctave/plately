import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useSettings } from './src/state/useSettings';
import { loadModel } from './src/ml/recognizer';
import { refreshCustomFoods } from './src/data/catalog';
import { palette, font } from './src/theme';

// Global default font for any <Text> that doesn't set its own fontFamily.
// Per-style fontFamily (e.g. font.family.uiBold, font.family.mono) overrides it.
const TextDefaults = Text as unknown as { defaultProps?: { style?: unknown } };
TextDefaults.defaultProps = TextDefaults.defaultProps ?? {};
TextDefaults.defaultProps.style = { fontFamily: font.family.ui };

export default function App() {
  const hydrated = useSettings((s) => s.hydrated);
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  // Warm up the model in the background so the first photo classifies fast.
  // Safe to call early: it fails soft and never throws.
  useEffect(() => {
    void loadModel().catch(() => undefined);
    // Load any user-created foods into the in-memory catalog.
    void refreshCustomFoods().catch(() => undefined);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {hydrated && fontsLoaded ? (
          <RootNavigator />
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={palette.green} size="large" />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg },
});
