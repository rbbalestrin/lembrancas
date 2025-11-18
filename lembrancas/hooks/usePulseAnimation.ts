import { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { useCallback } from 'react';

export const usePulseAnimation = () => {
  const scale = useSharedValue(1);

  const trigger = useCallback(() => {
    scale.value = withSequence(
      withSpring(1.3, {
        damping: 10,
        stiffness: 200,
      }),
      withSpring(1, {
        damping: 10,
        stiffness: 200,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, trigger };
};

