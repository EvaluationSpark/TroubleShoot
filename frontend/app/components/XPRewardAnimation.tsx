/**
 * Fix Stuff - XP Reward Animation Component
 * Company: RentMouse
 * Gamification System
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface XPRewardAnimationProps {
  visible: boolean;
  xpAwarded: number;
  bonusReasons?: string[];
  leveledUp?: boolean;
  newLevel?: number;
  newBadges?: Array<{id: string; name: string; icon: string; description: string}>;
  onClose: () => void;
}

export default function XPRewardAnimation({
  visible,
  xpAwarded,
  bonusReasons = [],
  leveledUp = false,
  newLevel,
  newBadges = [],
  onClose,
}: XPRewardAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);

      // Start animation sequence
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClose();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {leveledUp ? (
            // Level Up Animation
            <LinearGradient
              colors={['#fbbf24', '#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.levelUpCard}
            >
              <Ionicons name="trophy" size={64} color="#fff" />
              <Text style={styles.levelUpTitle}>LEVEL UP!</Text>
              <Text style={styles.levelUpLevel}>Level {newLevel}</Text>
              <Text style={styles.levelUpXP}>+{xpAwarded} XP</Text>
            </LinearGradient>
          ) : (
            // XP Reward Animation
            <View style={styles.xpCard}>
              <Ionicons name="star" size={48} color="#fbbf24" />
              <Text style={styles.xpAmount}>+{xpAwarded} XP</Text>
              {bonusReasons.length > 0 && (
                <View style={styles.bonusContainer}>
                  {bonusReasons.map((reason, index) => (
                    <Text key={index} style={styles.bonusText}>
                      ✨ {reason}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* New Badges */}
          {newBadges.length > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeTitle}>🏆 Badge Unlocked!</Text>
              {newBadges.map((badge, index) => (
                <View key={index} style={styles.badgeCard}>
                  <Ionicons name={badge.icon as any} size={32} color="#fbbf24" />
                  <View style={styles.badgeInfo}>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                    <Text style={styles.badgeDesc}>{badge.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    gap: 16,
  },
  xpCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  xpAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fbbf24',
    marginTop: 8,
  },
  bonusContainer: {
    marginTop: 16,
    gap: 4,
  },
  bonusText: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
  },
  levelUpCard: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  levelUpTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginTop: 16,
    letterSpacing: 2,
  },
  levelUpLevel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  levelUpXP: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  badgeContainer: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#fbbf24',
    maxWidth: 300,
  },
  badgeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fbbf24',
    marginBottom: 16,
    textAlign: 'center',
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  badgeDesc: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
});
