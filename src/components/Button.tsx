// =============================================================================
// Button — Primary CTA component
// =============================================================================
// Variants: primary (filled), secondary (outline), ghost (text-only), danger
// (red). Includes a press scale animation, optional left icon, loading
// spinner state, and a light haptic on press. Designed for full-width usage
// inside screen footers; pass `style` to override sizing.

import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { radius, spacing, font } from '../theme';
import { useTheme } from '../theme/ThemeContext';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const SPRING = { mass: 0.4, damping: 14, stiffness: 260 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
}: ButtonProps) {
  const p = useTheme();
  const styles = useMemo(() => makeStyles(p), [p]);
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isDisabled) return;
    scale.value = withSpring(0.96, SPRING);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING);
  };

  const handlePress = () => {
    if (isDisabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={[animatedStyle, isDisabled && styles.disabled, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!isDisabled }}
        accessibilityLabel={label}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[styles.base, styles[variant]]}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? p.white : p.text} />
        ) : (
          <View style={styles.content}>
            {icon}
            <Text style={[styles.label, variant === 'primary' && styles.labelPrimary]}>
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    base: {
      minHeight: 52,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    primary: { backgroundColor: p.accent },
    secondary: { backgroundColor: p.surfaceAlt },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: p.red },
    disabled: { opacity: 0.4 },
    label: {
      fontSize: font.size.lg,
      fontFamily: font.family.uiSemibold,
      color: p.text,
    },
    labelPrimary: { color: p.white },
  });
}
