// =============================================================================
// RootNavigator — App navigation graph
// =============================================================================
// Defines the full route tree: which screens exist, how they animate in, and
// what's visible before vs. after onboarding.
//
// Structure:
//   NavigationContainer
//     └── Stack.Navigator
//           ├── Onboarding flow (only mounted while `onboardingComplete = false`)
//           │     • Onboarding (landing) → OnboardingFlow (Q&A) → GoalResults → Auth
//           ├── Tabs (always mounted) — bottom tab bar with Home / Insights / History / Settings
//           ├── Camera / BarcodeScan — fullscreen modals pushed from Home
//           └── Detail screens (ConfirmFood, DayDetail, Achievements, etc.)
//
// Custom UI:
//   `AnimatedTabBar` is a hand-rolled bottom tab bar. It draws a sliding accent
//   pill behind the active tab and animates with react-native-reanimated. This
//   replaces React Navigation's default tab bar entirely.
//
// To add a screen: register it in `RootStackParamList` (../navigation/types.ts)
// then add a `<Stack.Screen>` here with the matching name.

import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { font, spacing, radius } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useSettings } from '../state/useSettings';
import type { RootStackParamList, TabParamList } from './types';

import { WeightScreen } from '../screens/WeightScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { AnalyzeScreen } from '../screens/AnalyzeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ConfirmFoodScreen } from '../screens/ConfirmFoodScreen';
import { DayDetailScreen } from '../screens/DayDetailScreen';
import { AddCustomFoodScreen } from '../screens/AddCustomFoodScreen';
import { MyFoodsScreen } from '../screens/MyFoodsScreen';
import { BarcodeScanScreen } from '../screens/BarcodeScanScreen';
import { GoalCalculatorScreen } from '../screens/GoalCalculatorScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { OnboardingFlowScreen } from '../screens/OnboardingFlowScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { GoalResultsScreen } from '../screens/GoalResultsScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { TermsScreen } from '../screens/TermsScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { RecipeBuilderScreen } from '../screens/RecipeBuilderScreen';
import { AppearanceScreen } from '../screens/AppearanceScreen';
import { PlatelyPlusScreen } from '../screens/PlatelyPlusScreen';
import { FastingScreen } from '../screens/FastingScreen';
import { GoalPhasesScreen } from '../screens/GoalPhasesScreen';
import { CoachScreen } from '../screens/CoachScreen';
import { MealPlannerScreen } from '../screens/MealPlannerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Ionicons name for each tab. `as keyof` is asserted because RN's type for
// `Ionicons.name` is a union of ~1000 strings — too noisy to redeclare.
const TAB_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  Home: 'today',
  Insights: 'stats-chart',
  History: 'calendar',
  Settings: 'settings',
};

// Display labels under each tab icon. Route names stay machine-friendly
// ("Home") while the user-visible string can differ ("Today").
const TAB_LABELS: Record<string, string> = {
  Home: 'Today',
  Insights: 'Insights',
  History: 'History',
  Settings: 'Settings',
};

/** Spring used for the sliding tab-bar pill. Gentle, not bouncy. */
const SPRING = { mass: 0.5, damping: 18, stiffness: 220 };
/** Width of the animated background pill, in px. */
const PILL_W = 64;

/**
 * Custom bottom tab bar. Renders a sliding accent-tinted pill behind the
 * focused tab and shows label + icon for each route. Position of the pill is
 * animated whenever the focused index changes.
 */
function AnimatedTabBar({ state, navigation }: BottomTabBarProps) {
  const p = useTheme();
  const accent = useSettings((s) => s.accent);
  const { width: screenWidth } = useWindowDimensions();
  const tabW = screenWidth / state.routes.length;

  const pillX = useSharedValue(state.index * tabW + tabW / 2 - PILL_W / 2);

  useEffect(() => {
    pillX.value = withSpring(state.index * tabW + tabW / 2 - PILL_W / 2, SPRING);
  }, [state.index, tabW]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  return (
    <View style={[tabStyles.bar, { backgroundColor: p.surface, borderTopColor: p.border }]}>
      <Animated.View style={[tabStyles.pill, pillStyle, { backgroundColor: accent + '22' }]} />

      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconName = TAB_ICONS[route.name] ?? 'ellipse';
        const label = TAB_LABELS[route.name] ?? route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: isFocused }}
            style={tabStyles.tab}
          >
            <Ionicons
              name={iconName}
              size={22}
              color={isFocused ? accent : p.textFaint}
            />
            <Text
              style={[
                tabStyles.label,
                { color: isFocused ? accent : p.textFaint },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E5DD',
    paddingBottom: 24, // home indicator space
    paddingTop: spacing.sm,
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: font.size.xs,
    fontFamily: font.family.uiMedium,
    letterSpacing: 0.2,
  },
  pill: {
    position: 'absolute',
    top: spacing.xs,
    width: PILL_W,
    height: 44,
    borderRadius: radius.lg,
  },
});

/**
 * The bottom-tab container shown after onboarding. Tabs are kept in sync with
 * `TabParamList`. The tab bar is our `AnimatedTabBar`, not the RN default.
 */
function Tabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Today' }} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

/**
 * The whole app's navigation tree. Conditionally mounts the onboarding stack
 * based on `onboardingComplete`. Once that flips true, the user is moved into
 * the `Tabs` route and the onboarding screens are unmounted entirely.
 */
export function RootNavigator() {
  const onboardingComplete = useSettings((s) => s.onboardingComplete);
  const accent = useSettings((s) => s.accent);
  const p = useTheme();

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: p.bg,
      card: p.surface,
      text: p.text,
      border: p.border,
      primary: accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: p.bg },
          headerTintColor: p.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: p.bg },
          animation: 'slide_from_right',
        }}
      >
        {/* Pre-onboarding screens. Mounted only until the user finishes onboarding,
            then unmounted entirely so they can never be reached again. */}
        {!onboardingComplete && (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OnboardingFlow" component={OnboardingFlowScreen} options={{ headerShown: false }} />
            <Stack.Screen name="GoalResults" component={GoalResultsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
          </>
        )}
        {/* Main app shell. Always mounted; the initial route falls through to
            this one once onboarding is complete. */}
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        {/* Post-onboarding auth presented as a modal (e.g. from Settings "Sign in"). */}
        {onboardingComplete && (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false, presentation: 'modal' }} />
        )}
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="Analyze" component={AnalyzeScreen} options={{ title: 'Analyze meal' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Add food' }} />
        <Stack.Screen
          name="ConfirmFood"
          component={ConfirmFoodScreen}
          options={{ title: 'Confirm' }}
        />
        <Stack.Screen name="DayDetail" component={DayDetailScreen} options={{ title: 'Day' }} />
        <Stack.Screen
          name="AddCustomFood"
          component={AddCustomFoodScreen}
          options={{ title: 'Create food' }}
        />
        <Stack.Screen name="MyFoods" component={MyFoodsScreen} options={{ title: 'My foods' }} />
        <Stack.Screen
          name="BarcodeScan"
          component={BarcodeScanScreen}
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="GoalCalculator"
          component={GoalCalculatorScreen}
          options={{ title: 'Goal calculator' }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ title: 'Privacy Policy' }}
        />
        <Stack.Screen
          name="Terms"
          component={TermsScreen}
          options={{ title: 'Terms of Service' }}
        />
        <Stack.Screen
          name="Achievements"
          component={AchievementsScreen}
          options={{ title: 'Achievements' }}
        />
        <Stack.Screen
          name="RecipeBuilder"
          component={RecipeBuilderScreen}
          options={{ title: 'New recipe' }}
        />
        <Stack.Screen
          name="Appearance"
          component={AppearanceScreen}
          options={{ title: 'Appearance' }}
        />
        <Stack.Screen
          name="PlatelyPlus"
          component={PlatelyPlusScreen}
          options={{ title: 'EvoEat+' }}
        />
        <Stack.Screen name="Weight" component={WeightScreen} options={{ title: 'Weight' }} />
        <Stack.Screen name="Fasting" component={FastingScreen} options={{ title: 'Fasting' }} />
        <Stack.Screen name="GoalPhases" component={GoalPhasesScreen} options={{ title: 'Goal phases' }} />
        <Stack.Screen name="Coach" component={CoachScreen} options={{ title: 'Smart Coach' }} />
        <Stack.Screen name="MealPlanner" component={MealPlannerScreen} options={{ title: 'Meal planner' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
