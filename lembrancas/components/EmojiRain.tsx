import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EMOJIS = ['🎉', '⭐', '✨', '🌟', '💫', '🎊', '🎈', '🌠', '✨', '🎯', '🏆', '👏'];
const EMOJI_COUNT = 40;
const ANIMATION_DURATION = 2000;

interface EmojiParticleProps {
  emoji: string;
  delay: number;
  startX: number;
}

const EmojiParticle: React.FC<EmojiParticleProps> = ({ emoji, delay, startX }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Initial pop-in
    scale.value = withDelay(delay, withSpring(1, { damping: 10 }));
    
    // Fall down
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 50, {
        duration: ANIMATION_DURATION,
        easing: Easing.linear,
      })
    );

    // Slight horizontal drift
    translateX.value = withDelay(
      delay,
      withTiming(startX + (Math.random() - 0.5) * 100, {
        duration: ANIMATION_DURATION,
        easing: Easing.inOut(Easing.ease),
      })
    );

    // Rotate
    rotate.value = withDelay(
      delay,
      withTiming((Math.random() - 0.5) * 720, {
        duration: ANIMATION_DURATION,
        easing: Easing.linear,
      })
    );

    // Fade out near the end
    opacity.value = withDelay(
      delay + ANIMATION_DURATION * 0.7,
      withTiming(0, {
        duration: ANIMATION_DURATION * 0.3,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.emoji, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
};

interface EmojiRainProps {
  onComplete?: () => void;
}

const EmojiRain: React.FC<EmojiRainProps> = ({ onComplete }) => {
  const particles = Array.from({ length: EMOJI_COUNT }, (_, i) => ({
    id: i,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    delay: Math.random() * 200,
    startX: Math.random() * SCREEN_WIDTH,
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, ANIMATION_DURATION + 500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <EmojiParticle
          key={particle.id}
          emoji={particle.emoji}
          delay={particle.delay}
          startX={particle.startX}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  emoji: {
    position: 'absolute',
    fontSize: 30,
    top: -50,
  },
});

export default EmojiRain;

