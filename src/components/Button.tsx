// =============================================================================
// Button — Primary CTA component
// =============================================================================
// Variants: primary (filled), secondary (outline), ghost (text-only), danger
// (red). Includes a press scale animation, optional left icon, loading
// spinner state, and a light haptic on press. Designed for full-width usage
// inside screen footers; pass `style` to override sizing.

import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { palette, radius, spacing, font } from '../theme';

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
          <ActivityIndicator color={variant === 'primary' ? palette.white : palette.text} />
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

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  primary: { backgroundColor: palette.accent },
  secondary: { backgroundColor: palette.surfaceAlt },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: palette.red },
  disabled: { opacity: 0.4 },
  label: {
    fontSize: font.size.lg,
    fontFamily: font.family.uiSemibold,
    color: palette.text,
  },
  labelPrimary: { color: palette.white },
});
