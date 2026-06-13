import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { palette, font, spacing, radius } from '../theme';
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
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
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

const TAB_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  Home: 'today',
  Insights: 'stats-chart',
  History: 'calendar',
  Settings: 'settings',
};

const TAB_LABELS: Record<string, string> = {
  Home: 'Today',
  Insights: 'Insights',
  History: 'History',
  Settings: 'Settings',
};

const SPRING = { mass: 0.5, damping: 18, stiffness: 220 };
const PILL_W = 64;

function AnimatedTabBar({ state, navigation }: BottomTabBarProps) {
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
    <View style={tabStyles.bar}>
      {/* Sliding background pill */}
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
              color={isFocused ? accent : palette.textFaint}
            />
            <Text
              style={[
                tabStyles.label,
                { color: isFocused ? accent : palette.textFaint },
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
    backgroundColor: palette.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
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

export function RootNavigator() {
  const onboardingComplete = useSettings((s) => s.onboardingComplete);
  const accent = useSettings((s) => s.accent);

  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: palette.bg,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      primary: accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: palette.bg },
          headerTintColor: palette.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: palette.bg },
          animation: 'slide_from_right',
        }}
      >
        {!onboardingComplete && (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
        )}
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
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
          options={{ title: 'Plately+' }}
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
