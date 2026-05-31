import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useSettings } from './src/state/useSettings';
import { loadModel } from './src/ml/recognizer';
import { refreshCustomFoods } from './src/data/catalog';
import { palette } from './src/theme';

export default function App() {
  const hydrated = useSettings((s) => s.hydrated);

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
        {hydrated ? (
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
