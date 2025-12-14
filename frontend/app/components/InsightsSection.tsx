/**
 * FixIntel AI - Insights Section Component
 * Company: RentMouse
 * PR #8: Repair History & Insights
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InsightsSectionProps {
  insights: any;
}

export default function InsightsSection({ insights }: InsightsSectionProps) {
  if (!insights || insights.total_repairs === 0) {
    return (
      <View style={[styles.emptyState, { marginBottom: 24 }]}>
        <Ionicons name="bar-chart-outline" size={64} color="#6b7280" />
        <Text style={styles.emptyTitle}>No Insights Yet</Text>
        <Text style={styles.emptyText}>
          Complete your first repair to see your statistics and achievements!
        </Text>
      </View>
    );
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <>
      {/* Header */}
      <View style={[styles.header, styles.container]}>
        <Ionicons name="stats-chart" size={24} color="#00D9FF" />
        <Text style={styles.headerTitle}>Your Repair Insights</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Money Saved */}
        <View style={[styles.statCard, styles.statCardMoney]}>
          <Ionicons name="cash-outline" size={32} color="#10b981" />
          <Text style={styles.statValue}>
            {insights.currency}${insights.money_saved?.toFixed(0) || 0}
          </Text>
          <Text style={styles.statLabel}>Money Saved</Text>
          <Text style={styles.statSubtext}>vs Pro Repairs</Text>
        </View>

        {/* Total Repairs */}
        <View style={[styles.statCard, styles.statCardRepairs]}>
          <Ionicons name="construct-outline" size={32} color="#00D9FF" />
          <Text style={styles.statValue}>{insights.total_repairs}</Text>
          <Text style={styles.statLabel}>Total Repairs</Text>
          <Text style={styles.statSubtext}>
            {insights.completed_repairs} completed
          </Text>
        </View>

        {/* Time Invested */}
        <View style={[styles.statCard, styles.statCardTime]}>
          <Ionicons name="time-outline" size={32} color="#f59e0b" />
          <Text style={styles.statValue}>
            {formatTime(insights.time_invested || 0)}
          </Text>
          <Text style={styles.statLabel}>Time Invested</Text>
          <Text style={styles.statSubtext}>Hands-on work</Text>
        </View>

        {/* Success Rate */}
        <View style={[styles.statCard, styles.statCardRate]}>
          <Ionicons name="trophy-outline" size={32} color="#8b5cf6" />
          <Text style={styles.statValue}>
            {insights.completion_rate?.toFixed(0) || 0}%
          </Text>
          <Text style={styles.statLabel}>Success Rate</Text>
          <Text style={styles.statSubtext}>Completion</Text>
        </View>
      </View>

      {/* Most Common Repairs */}
      {insights.most_common_repairs?.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Common Repairs</Text>
          {insights.most_common_repairs.map((repair: any, index: number) => (
            <View key={index} style={styles.repairItem}>
              <View style={styles.repairRank}>
                <Text style={styles.repairRankText}>#{index + 1}</Text>
              </View>
              <Text style={styles.repairType}>{repair.type}</Text>
              <View style={styles.repairBadge}>
                <Text style={styles.repairCount}>{repair.count}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Achievements */}
      {insights.achievements?.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Achievements</Text>
          <View style={styles.achievementsGrid}>
            {insights.achievements.map((achievement: any, index: number) => (
              <View key={index} style={styles.achievementCard}>
                <Ionicons name={achievement.icon} size={28} color="#fbbf24" />
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDesc}>{achievement.description}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Motivational Message */}
      <View style={styles.motivationCard}>
        <Ionicons name="sparkles" size={20} color="#00D9FF" />
        <Text style={styles.motivationText}>
          {insights.money_saved > 0
            ? `You've saved enough to treat yourself! Keep up the great work! 💪`
            : `Every repair makes you more skilled and saves you money! 🚀`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statCardMoney: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  statCardRepairs: {
    borderLeftWidth: 4,
    borderLeftColor: '#00D9FF',
  },
  statCardTime: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  statCardRate: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  repairItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  repairRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00D9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  repairRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  repairType: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  repairBadge: {
    backgroundColor: 'rgba(0,217,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  repairCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D9FF',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
    marginTop: 8,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 4,
    textAlign: 'center',
  },
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,217,255,0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,217,255,0.3)',
    gap: 12,
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
});
