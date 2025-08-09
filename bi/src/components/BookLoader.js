import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BookLoader = ({ colors }) => {
  const rotate = useRef(new Animated.Value(0)).current; // -1..1 -> -10..10deg
  const scale = useRef(new Animated.Value(0.9)).current; // pulse
  const opacity = useRef(new Animated.Value(0)).current; // fade in

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // Gentle sway
    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: -1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    sway.start();
    pulse.start();

    return () => {
      sway.stop();
      pulse.stop();
    };
  }, [opacity, rotate, scale]);

  const rotateDeg = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: colors?.background || '#fff' }]}>
      <Animated.View
        style={[
          styles.iconWrap,
          {
            opacity,
            transform: [{ rotate: rotateDeg }, { scale }],
          },
        ]}
      >
        <Ionicons name="book" size={72} color={colors?.primary || '#4f46e5'} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BookLoader;
