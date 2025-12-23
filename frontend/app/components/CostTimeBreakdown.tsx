/**
 * Fix Stuff - Cost & Time Breakdown Components
 * Company: RentMouse
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { CostEstimate, TimeEstimate } from '../types/models';

interface CostBreakdownProps {
  costEstimate?: CostEstimate;
}

interface TimeBreakdownProps {
  timeEstimate?: TimeEstimate;
}

export function CostBreakdown({ costEstimate }: CostBreakdownProps) {
  const { theme } = useTheme();

  if (!costEstimate) return null;

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(0)}`;
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cost Estimate</Text>
      
      {/* Cost Range */}
      <BlurView
        intensity={theme.colors.glassBlur}
        tint={theme.colors.glassTint}
        style={[styles.card, { borderColor: theme.colors.glassBorder }]}
      >
        <View style={styles.costRangeContainer}>
          <View style={styles.costRangeBar}>
            <View style={[styles.costMarker, styles.costMarkerLow]}>
              <Text style={styles.costLabel}>Low</Text>
              <Text style={[styles.costValue, { color: theme.colors.success }]}>
                {formatCurrency(costEstimate.low)}
              </Text>
            </View>
            <View style={[styles.costMarker, styles.costMarkerTypical]}>
              <Text style={styles.costLabel}>Typical</Text>
              <Text style={[styles.costValue, { color: theme.colors.primary }]}>
                {formatCurrency(costEstimate.typical)}
              </Text>
            </View>
            <View style={[styles.costMarker, styles.costMarkerHigh]}>
              <Text style={styles.costLabel}>High</Text>
              <Text style={[styles.costValue, { color: theme.colors.warning }]}>
                {formatCurrency(costEstimate.high)}
              </Text>
            </View>
          </View>
          <View style={styles.costRangeLine}>
            <View style={[styles.costRangeFill, { backgroundColor: theme.colors.primary }]} />
          </View>
        </View>
      </BlurView>

      {/* Parts Breakdown */}
      {costEstimate.partsBreakdown && costEstimate.partsBreakdown.length > 0 && (
        <BlurView
          intensity={theme.colors.glassBlur}
          tint={theme.colors.glassTint}
          style={[styles.card, { borderColor: theme.colors.glassBorder }]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            <Ionicons name="cube" size={16} color={theme.colors.primary} /> Parts Breakdown
          </Text>
          {costEstimate.partsBreakdown.map((part, index) => (
            <View key={index} style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
                {part.name}
              </Text>
              <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                {formatCurrency(part.cost)}
              </Text>
            </View>
          ))}
          
          {costEstimate.toolsCost > 0 && (
            <View style={[styles.breakdownRow, styles.breakdownRowBorder]}>
              <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
                Tools (if needed)
              </Text>
              <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                {formatCurrency(costEstimate.toolsCost)}
              </Text>
            </View>
          )}
        </BlurView>
      )}

      {/* Labor Hours (Pro Mode) */}
      {costEstimate.laborHoursRange && (
        <BlurView
          intensity={theme.colors.glassBlur}
          tint={theme.colors.glassTint}
          style={[styles.card, { borderColor: theme.colors.glassBorder }]}
        >
          <View style={styles.laborContainer}>
            <Ionicons name="time" size={20} color={theme.colors.accent} />
            <View style={styles.laborText}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Professional Labor
              </Text>
              <Text style={[styles.laborHours, { color: theme.colors.textSecondary }]}>
                {costEstimate.laborHoursRange.min}-{costEstimate.laborHoursRange.max} hours estimated
              </Text>
            </View>
          </View>
        </BlurView>
      )}

      {/* Assumptions */}
      {costEstimate.assumptions && costEstimate.assumptions.length > 0 && (
        <View style={styles.assumptionsContainer}>
          <Text style={[styles.assumptionsTitle, { color: theme.colors.textTertiary }]}>
            <Ionicons name="information-circle" size={14} color={theme.colors.textTertiary} /> Cost Assumptions:
          </Text>
          {costEstimate.assumptions.map((assumption, index) => (
            <Text key={index} style={[styles.assumptionText, { color: theme.colors.textTertiary }]}>
              • {assumption}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

export function TimeBreakdown({ timeEstimate }: TimeBreakdownProps) {
  const { theme } = useTheme();

  if (!timeEstimate) return null;

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const getPercentage = (part: number, total: number) => {
    return ((part / total) * 100).toFixed(0);
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Time Estimate</Text>
      
      {/* Total Time */}
      <BlurView
        intensity={theme.colors.glassBlur}
        tint={theme.colors.glassTint}
        style={[styles.card, { borderColor: theme.colors.glassBorder }]}
      >
        <View style={styles.totalTimeContainer}>
          <View style={styles.totalTimeIcon}>
            <Ionicons name="timer" size={32} color={theme.colors.primary} />
          </View>
          <View style={styles.totalTimeText}>
            <Text style={[styles.totalTimeLabel, { color: theme.colors.textSecondary }]}>
              Total Time
            </Text>
            <Text style={[styles.totalTimeValue, { color: theme.colors.text }]}>
              {formatTime(timeEstimate.total)}
            </Text>
          </View>
        </View>
      </BlurView>

      {/* Time Breakdown */}
      <BlurView
        intensity={theme.colors.glassBlur}
        tint={theme.colors.glassTint}
        style={[styles.card, { borderColor: theme.colors.glassBorder }]}
      >
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          <Ionicons name="hourglass" size={16} color={theme.colors.primary} /> Time Breakdown
        </Text>
        
        {/* Prep Time */}
        {timeEstimate.prep > 0 && (
          <View style={styles.timeRow}>
            <View style={styles.timeRowLeft}>
              <View style={[styles.timeColorDot, { backgroundColor: theme.colors.info }]} />
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
                Preparation
              </Text>
            </View>
            <Text style={[styles.timeValue, { color: theme.colors.text }]}>
              {formatTime(timeEstimate.prep)} ({getPercentage(timeEstimate.prep, timeEstimate.total)}%)
            </Text>
          </View>
        )}

        {/* Active Time */}
        <View style={styles.timeRow}>
          <View style={styles.timeRowLeft}>
            <View style={[styles.timeColorDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
              Active Repair
            </Text>
          </View>
          <Text style={[styles.timeValue, { color: theme.colors.text }]}>
            {formatTime(timeEstimate.active)} ({getPercentage(timeEstimate.active, timeEstimate.total)}%)
          </Text>
        </View>

        {/* Cure Time */}
        {timeEstimate.cure && timeEstimate.cure > 0 && (
          <View style={styles.timeRow}>
            <View style={styles.timeRowLeft}>
              <View style={[styles.timeColorDot, { backgroundColor: theme.colors.warning }]} />
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
                Curing/Drying
              </Text>
            </View>
            <Text style={[styles.timeValue, { color: theme.colors.text }]}>
              {formatTime(timeEstimate.cure)} ({getPercentage(timeEstimate.cure, timeEstimate.total)}%)
            </Text>
          </View>
        )}

        {/* Visual Timeline */}
        <View style={styles.timeline}>
          {timeEstimate.prep > 0 && (
            <View
              style={[
                styles.timelineSegment,
                {
                  backgroundColor: theme.colors.info,
                  width: `${getPercentage(timeEstimate.prep, timeEstimate.total)}%`,
                },
              ]}
            />
          )}
          <View
            style={[
              styles.timelineSegment,
              {
                backgroundColor: theme.colors.primary,
                width: `${getPercentage(timeEstimate.active, timeEstimate.total)}%`,
              },
            ]}
          />
          {timeEstimate.cure && timeEstimate.cure > 0 && (
            <View
              style={[
                styles.timelineSegment,
                {
                  backgroundColor: theme.colors.warning,
                  width: `${getPercentage(timeEstimate.cure, timeEstimate.total)}%`,
                },
              ]}
            />
          )}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  
  // Cost Range
  costRangeContainer: {
    marginBottom: 8,
  },
  costRangeBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  costMarker: {
    alignItems: 'center',
  },
  costMarkerLow: {
    alignItems: 'flex-start',
  },
  costMarkerTypical: {
    alignItems: 'center',
  },
  costMarkerHigh: {
    alignItems: 'flex-end',
  },
  costLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  costValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  costRangeLine: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  costRangeFill: {
    height: '100%',
    width: '100%',
  },

  // Breakdown
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  breakdownRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
    paddingTop: 16,
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Labor
  laborContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  laborText: {
    flex: 1,
  },
  laborHours: {
    fontSize: 13,
    marginTop: 2,
  },

  // Assumptions
  assumptionsContainer: {
    marginTop: 8,
  },
  assumptionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  assumptionText: {
    fontSize: 11,
    lineHeight: 16,
    marginLeft: 8,
  },

  // Total Time
  totalTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  totalTimeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalTimeText: {
    flex: 1,
  },
  totalTimeLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalTimeValue: {
    fontSize: 28,
    fontWeight: '900',
  },

  // Time Rows
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeLabel: {
    fontSize: 14,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Timeline
  timeline: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 12,
  },
  timelineSegment: {
    height: '100%',
  },
});
