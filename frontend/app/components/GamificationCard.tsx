import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface GamificationCardProps {
  onClose?: () => void;
}

interface RankInfo {
  name: string;
  min_xp: number;
  badge: string;
  color: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  xp: number;
  badge: string;
}

interface GamificationProfile {
  xp: number;
  rank: RankInfo;
  next_rank: { rank: RankInfo; xp_needed: number } | null;
  total_repairs_completed: number;
  total_steps_completed: number;
  achievements: Achievement[];
  current_streak: number;
  longest_streak: number;
  repairs_by_category: { [key: string]: number };
  all_ranks: RankInfo[];
  all_achievements: Achievement[];
}

export default function GamificationCard({ onClose }: GamificationCardProps) {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile && profile.next_rank) {
      const currentRankXP = profile.rank.min_xp;
      const nextRankXP = profile.next_rank.rank.min_xp;
      const progress = (profile.xp - currentRankXP) / (nextRankXP - currentRankXP);
      
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/gamification/profile?user_id=default_user`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching gamification profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator color="#00D9FF" />
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Default rank if not available
  const currentRank = profile.rank || { name: 'Novice Fixer', badge: '🔰', color: '#9CA3AF', min_xp: 0 };

  return (
    <>
      <TouchableOpacity onPress={() => setShowFullProfile(true)}>
        <BlurView intensity={40} tint="dark" style={styles.card}>
          <View style={styles.rankSection}>
            <Text style={[styles.rankBadge, { color: currentRank.color }]}>
              {currentRank.badge}
            </Text>
            <View style={styles.rankInfo}>
              <Text style={styles.rankName}>{currentRank.name}</Text>
              <Text style={styles.xpText}>{profile.xp || 0} XP</Text>
            </View>
            <View style={styles.statsQuick}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                <Text style={styles.statValue}>{profile.total_repairs_completed || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={16} color="#f97316" />
                <Text style={styles.statValue}>{profile.current_streak || 0}</Text>
              </View>
            </View>
          </View>
          
          {profile.next_rank && profile.next_rank.rank && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    { width: progressWidth, backgroundColor: profile.rank.color }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {profile.next_rank.xp_needed} XP to {profile.next_rank.rank.name}
              </Text>
            </View>
          )}
        </BlurView>
      </TouchableOpacity>

      {/* Full Profile Modal */}
      <Modal visible={showFullProfile} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Progress</Text>
              <TouchableOpacity onPress={() => setShowFullProfile(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Rank Display */}
              <View style={styles.rankDisplay}>
                <Text style={[styles.bigBadge, { color: profile.rank.color }]}>
                  {profile.rank.badge}
                </Text>
                <Text style={[styles.bigRankName, { color: profile.rank.color }]}>
                  {profile.rank.name}
                </Text>
                <Text style={styles.bigXP}>{profile.xp} XP</Text>
                
                {profile.next_rank && (
                  <View style={styles.nextRankInfo}>
                    <View style={styles.bigProgressBar}>
                      <View 
                        style={[
                          styles.bigProgressFill, 
                          { 
                            width: `${((profile.xp - profile.rank.min_xp) / (profile.next_rank.rank.min_xp - profile.rank.min_xp)) * 100}%`,
                            backgroundColor: profile.rank.color 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.nextRankText}>
                      {profile.next_rank.xp_needed} XP to {profile.next_rank.rank.badge} {profile.next_rank.rank.name}
                    </Text>
                  </View>
                )}
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Ionicons name="construct" size={24} color="#4ade80" />
                  <Text style={styles.statBoxValue}>{profile.total_repairs_completed}</Text>
                  <Text style={styles.statBoxLabel}>Repairs</Text>
                </View>
                <View style={styles.statBox}>
                  <Ionicons name="list" size={24} color="#60a5fa" />
                  <Text style={styles.statBoxValue}>{profile.total_steps_completed}</Text>
                  <Text style={styles.statBoxLabel}>Steps</Text>
                </View>
                <View style={styles.statBox}>
                  <Ionicons name="flame" size={24} color="#f97316" />
                  <Text style={styles.statBoxValue}>{profile.current_streak}</Text>
                  <Text style={styles.statBoxLabel}>Streak</Text>
                </View>
                <View style={styles.statBox}>
                  <Ionicons name="trophy" size={24} color="#fbbf24" />
                  <Text style={styles.statBoxValue}>{profile.achievements.length}</Text>
                  <Text style={styles.statBoxLabel}>Badges</Text>
                </View>
              </View>

              {/* Achievements */}
              <Text style={styles.sectionTitle}>Achievements</Text>
              <View style={styles.achievementsGrid}>
                {profile.all_achievements.map((achievement) => {
                  const earned = profile.achievements.some(a => a.id === achievement.id);
                  return (
                    <View 
                      key={achievement.id} 
                      style={[styles.achievementCard, !earned && styles.achievementLocked]}
                    >
                      <Text style={[styles.achievementBadge, !earned && styles.lockedBadge]}>
                        {achievement.badge}
                      </Text>
                      <Text style={[styles.achievementName, !earned && styles.lockedText]}>
                        {achievement.name}
                      </Text>
                      <Text style={[styles.achievementDesc, !earned && styles.lockedText]}>
                        {achievement.description}
                      </Text>
                      <Text style={[styles.achievementXP, !earned && styles.lockedText]}>
                        +{achievement.xp} XP
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* All Ranks */}
              <Text style={styles.sectionTitle}>Ranks</Text>
              <View style={styles.ranksContainer}>
                {profile.all_ranks.map((rank, index) => {
                  const isCurrentRank = rank.name === profile.rank.name;
                  const isUnlocked = profile.xp >= rank.min_xp;
                  return (
                    <View 
                      key={rank.name} 
                      style={[
                        styles.rankRow,
                        isCurrentRank && styles.currentRankRow,
                        !isUnlocked && styles.lockedRankRow
                      ]}
                    >
                      <Text style={[styles.rankRowBadge, { color: isUnlocked ? rank.color : '#555' }]}>
                        {rank.badge}
                      </Text>
                      <View style={styles.rankRowInfo}>
                        <Text style={[styles.rankRowName, !isUnlocked && styles.lockedText]}>
                          {rank.name}
                        </Text>
                        <Text style={styles.rankRowXP}>{rank.min_xp} XP</Text>
                      </View>
                      {isCurrentRank && (
                        <View style={styles.currentTag}>
                          <Text style={styles.currentTagText}>Current</Text>
                        </View>
                      )}
                      {!isUnlocked && (
                        <Ionicons name="lock-closed" size={16} color="#555" />
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingCard: {
    padding: 20,
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  rankSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    fontSize: 32,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  xpText: {
    fontSize: 14,
    color: '#aaa',
  },
  statsQuick: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progressSection: {
    marginTop: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalScroll: {
    padding: 20,
  },
  rankDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  bigBadge: {
    fontSize: 64,
  },
  bigRankName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  bigXP: {
    fontSize: 18,
    color: '#aaa',
    marginTop: 4,
  },
  nextRankInfo: {
    width: '100%',
    marginTop: 16,
  },
  bigProgressBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  bigProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  nextRankText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '47%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  achievementLocked: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  achievementBadge: {
    fontSize: 32,
  },
  lockedBadge: {
    opacity: 0.3,
  },
  achievementName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  achievementXP: {
    fontSize: 12,
    color: '#4ade80',
    fontWeight: '600',
    marginTop: 6,
  },
  lockedText: {
    color: '#555',
  },
  ranksContainer: {
    gap: 8,
    marginBottom: 40,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  currentRankRow: {
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  lockedRankRow: {
    backgroundColor: '#1a1a1a',
  },
  rankRowBadge: {
    fontSize: 24,
  },
  rankRowInfo: {
    flex: 1,
  },
  rankRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  rankRowXP: {
    fontSize: 12,
    color: '#888',
  },
  currentTag: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
  },
});
