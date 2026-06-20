// =============================================================================
// App.tsx — Application root
// =============================================================================
// Top-level mount point. Responsibilities:
//   1. Load the custom fonts (Space Grotesk + JetBrains Mono).
//   2. Wait for the persisted settings store to hydrate from AsyncStorage.
//   3. Set the system default font on `Text` so unstyled text still looks right.
//   4. Warm up the on-device recognizer + the custom-foods catalog in the
//      background so the first user interaction feels instant.
//   5. Render the navigator inside the providers RN needs (gesture root,
//      safe-area, status bar).
//
// The Splash → first paint sequence:
//   App → ActivityIndicator (while !hydrated || !fontsLoaded)
//       → RootNavigator     (once both are ready)
//
// Anything async-but-non-blocking (model warmup, catalog load) is fired in
// effects and allowed to fail silently — the UI falls back gracefully.

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

// Set the default font on the `Text` component so any unstyled <Text> still
// renders in our UI typeface. RN exposes this through a private `defaultProps`
// surface that's not in the public types — the cast is intentional.
const TextDefaults = Text as unknown as { defaultProps?: { style?: unknown } };
TextDefaults.defaultProps = TextDefaults.defaultProps ?? {};
TextDefaults.defaultProps.style = { fontFamily: font.family.ui };

export default function App() {
  // `hydrated` flips true once Zustand finishes reading the persisted settings.
  // Until then, we show a loader so the UI doesn't flicker with default values.
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

  // Background warmups — kicked off once at startup. Both are fail-soft:
  //   - `loadModel`: downloads or loads the cached TFLite model. If it fails,
  //     the recognizer reports `unavailable` and the camera flow falls back to
  //     manual search. See `src/ml/recognizer.ts`.
  //   - `refreshCustomFoods`: pulls user-added foods into the in-memory catalog
  //     so search results include them. See `src/data/catalog.ts`.
  useEffect(() => {
    void loadModel().catch(() => undefined);
    void refreshCustomFoods().catch(() => undefined);
  }, []);

  return (
    // GestureHandlerRootView is required by react-native-gesture-handler at the
    // very top of the tree. SafeAreaProvider gives every screen the inset hooks.
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {/* Light theme → dark status bar text. */}
        <StatusBar style="dark" />
        {hydrated && fontsLoaded ? (
          <RootNavigator />
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={palette.accent} size="large" />
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
