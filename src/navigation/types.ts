import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

import type { EntrySource } from '../db/database';

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  Camera: undefined;
  Analyze: { photoUri: string };
  Search: undefined;
  ConfirmFood: {
    foodId: string;
    photoUri?: string;
    source: EntrySource;
    suggestedGrams?: number;
  };
  DayDetail: { day: string };
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type { EntrySource };
