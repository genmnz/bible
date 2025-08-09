import { useCallback, useRef } from 'react';

/**
 * useHeaderScrollShadow
 *
 * Provides an efficient onScroll handler that toggles a subtle React Navigation
 * header bottom border (no native shadows) when the scroll offset passes a threshold.
 *
 * - Minimizes navigation.setOptions calls (stateful guard)
 * - Uses requestAnimationFrame to coalesce rapid scroll events
 * - Works with ScrollView and FlatList (attach to their onScroll)
 *
 * Usage:
 * const onScroll = useHeaderScrollShadow(navigation, { colors, threshold: 6 });
 * <ScrollView onScroll={onScroll} scrollEventThrottle={16} ... />
 */
export default function useHeaderScrollShadow(navigation, { colors, threshold = 6 } = {}) {
  const hasShadowRef = useRef(false);
  const tickingRef = useRef(false);

  const setShadow = useCallback((show) => {
    if (hasShadowRef.current === show) return;
    hasShadowRef.current = show;

    // Apply only a subtle bottom border for both platforms; never enable native shadows
    navigation.setOptions({
      headerShadowVisible: false,
      headerStyle: show
        ? {
            backgroundColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: (colors && colors.border) || 'rgba(255,255,255,0.08)',
          }
        : {
            backgroundColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
            borderBottomColor: 'transparent',
          },
    });
  }, [navigation, colors]);

  const onScroll = useCallback((event) => {
    const y = event?.nativeEvent?.contentOffset?.y || 0;

    if (!tickingRef.current) {
      tickingRef.current = true;
      requestAnimationFrame(() => {
        setShadow(y > threshold);
        tickingRef.current = false;
      });
    }
  }, [setShadow, threshold]);

  return onScroll;
}
