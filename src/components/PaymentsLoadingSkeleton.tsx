import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

/**
 * Placeholder rows shown while the payments load.
 *
 * The blocks mirror the real summary card and payment cards, so the layout does
 * not jump when the data arrives. Every block shares one opacity pulse, which
 * keeps it to a single native animation.
 */
export function PaymentsLoadingSkeleton() {
  // The animated value is created once and held in state, not read from a ref:
  // this app enables the React Compiler, which rejects `useRef(...).current`
  // during render.
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.screen, { opacity }]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading payments"
    >
      <View style={styles.summaryCard}>
        <SkeletonBar width={80} height={12} />
        <SkeletonBar width={140} height={24} style={styles.spaced} />
        <SkeletonBar width={110} height={12} style={styles.spaced} />
      </View>
      {[0, 1, 2].map((key) => (
        <View key={key} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardInfo}>
              <SkeletonBar width="60%" height={16} />
              <SkeletonBar width="40%" height={13} style={styles.spaced} />
            </View>
            <SkeletonBar width={72} height={16} />
          </View>
          <SkeletonBar width="45%" height={12} />
        </View>
      ))}
    </Animated.View>
  );
}

function SkeletonBar({
  width,
  height,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  style?: object;
}) {
  return <View style={[styles.bar, { width, height }, style]} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
  },
  bar: {
    backgroundColor: '#E1E7E3',
    borderRadius: 6,
  },
  spaced: {
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E7E3',
    padding: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E7E3',
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardInfo: {
    flex: 1,
    marginRight: 16,
  },
});
