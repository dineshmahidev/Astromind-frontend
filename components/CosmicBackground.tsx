import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withDelay,
  useSharedValue,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const Star = ({ size, top, left, delay }: { size: number, top: number, left: number, delay: number }) => {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2000 }), -1, true)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      style={[
        styles.star, 
        { width: size, height: size, top, left, borderRadius: size / 2 },
        animatedStyle
      ]} 
    />
  );
};

export const CosmicBackground = ({ children }: { children: React.ReactNode }) => {
  const stars = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    top: Math.random() * height,
    left: Math.random() * width,
    delay: Math.random() * 2000,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={StyleSheet.absoluteFill}
      />
      {stars.map(star => (
        <Star key={star.id} {...star} />
      ))}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  star: {
    backgroundColor: '#fff',
    position: 'absolute',
  },
});
