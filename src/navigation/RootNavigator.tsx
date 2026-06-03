import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { palette } from '../theme';
import { useSettings } from '../state/useSettings';
import type { RootStackParamList, TabParamList } from './types';

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

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.bg,
    card: palette.surface,
    text: palette.text,
    border: palette.border,
    primary: palette.green,
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.green,
        tabBarInactiveTintColor: palette.textFaint,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
        },
        tabBarIcon: ({ color, size }) => {
          const icon =
            route.name === 'Home'
              ? 'today'
              : route.name === 'Insights'
                ? 'stats-chart'
                : route.name === 'History'
                  ? 'calendar'
                  : 'settings';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
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

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: palette.bg },
          headerTintColor: palette.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: palette.bg },
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
