import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import InsightsSection from '../components/InsightsSection'; // PR #8
import RepairInstructionsModal from '../components/RepairInstructionsModal';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const REPAIRS_STORAGE_KEY = '@pix_fix_repairs';

export default function ProgressScreen() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<any>(null); // PR #8
  const [showInsights, setShowInsights] = useState(true); // PR #8
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch sessions when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchSessions();
    }, [])
  );

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      // Fetch from both sources + insights (PR #8)
      const [backendSessions, localSessions, insightsData] = await Promise.all([
        fetchBackendSessions(),
        fetchLocalSessions(),
        fetchInsights(),
      ]);

      // Merge and deduplicate sessions (prefer backend data)
      const allSessions = [...backendSessions];
      const backendIds = new Set(backendSessions.map((s: any) => s.repair_id));
      
      // Add local sessions that aren't in backend
      localSessions.forEach((localSession: any) => {
        if (!backendIds.has(localSession.repair_id)) {
          allSessions.push(localSession);
        }
      });

      // Sort by updated_at or timestamp
      allSessions.sort((a: any, b: any) => {
        const dateA = new Date(a.updated_at || a.timestamp || 0);
        const dateB = new Date(b.updated_at || b.timestamp || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setSessions(allSessions);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBackendSessions = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/repair-sessions`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return [];
    } catch (error) {
      console.log('Backend fetch failed, using local data only');
      return [];
    }
  };

  const fetchLocalSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem(REPAIRS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Error fetching local sessions:', error);
      return [];
    }
  };

  // PR #8: Fetch repair insights
  const fetchInsights = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/repair-insights`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.log('Insights fetch failed:', error);
      return null;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  const getProgressColor = (progress: number) => {
    if (progress < 33) return '#f87171';
    if (progress < 66) return '#fbbf24';
    return '#4ade80';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D9FF" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/icon.png')}
      style={styles.container}
      resizeMode="cover"
      blurRadius={80}
    >
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.95)', 'rgba(15, 23, 42, 0.98)', 'rgba(0, 0, 0, 0.99)']}
        style={styles.gradientOverlay}
      >
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D9FF" />}
          >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Repairs</Text>
          <Text style={styles.headerSubtitle}>Track your ongoing repair projects & insights</Text>
        </View>

        {/* PR #8: Insights Section */}
        {showInsights && <InsightsSection insights={insights} />}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="construct" size={28} color="#00D9FF" />
            <Text style={styles.statNumber}>{sessions.length}</Text>
            <Text style={styles.statLabel}>Total Repairs</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={28} color="#4ade80" />
            <Text style={styles.statNumber}>
              {sessions.filter(s => s.progress_percentage === 100).length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={28} color="#fbbf24" />
            <Text style={styles.statNumber}>
              {sessions.filter(s => s.progress_percentage > 0 && s.progress_percentage < 100).length}
            </Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={64} color="#555" />
            <Text style={styles.emptyText}>No saved repairs yet</Text>
            <Text style={styles.emptySubtext}>Start a repair from the Home tab and save it to track your progress</Text>
          </View>
        ) : (
          <View style={styles.sessionsContainer}>
            <Text style={styles.sectionTitle}>Saved Repairs</Text>
            {sessions.map((session) => (
              <TouchableOpacity key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionIconContainer}>
                    <Ionicons
                      name={session.progress_percentage === 100 ? 'checkmark-circle' : 'construct'}
                      size={24}
                      color={session.progress_percentage === 100 ? '#4ade80' : '#00D9FF'}
                    />
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    {session.notes && (
                      <Text style={styles.sessionNotes} numberOfLines={2}>
                        {session.notes}
                      </Text>
                    )}
                    <Text style={styles.sessionDate}>
                      Saved on {new Date(session.updated_at || session.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={[styles.progressPercentage, { color: getProgressColor(session.progress_percentage) }]}>
                      {session.progress_percentage}%
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${session.progress_percentage}%`,
                          backgroundColor: getProgressColor(session.progress_percentage),
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.sessionActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      setSelectedSession(session);
                      setShowDetailsModal(true);
                    }}
                  >
                    <Ionicons name="eye" size={16} color="#00D9FF" />
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </TouchableOpacity>
                  {session.progress_percentage < 100 && (
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="arrow-forward" size={16} color="#4ade80" />
                      <Text style={[styles.actionButtonText, { color: '#4ade80' }]}>Continue</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color="#fbbf24" />
            <Text style={styles.tipsTitle}>Pro Tips</Text>
          </View>
          <Text style={styles.tipText}>• Save repairs to track your progress over time</Text>
          <Text style={styles.tipText}>• Take before and after photos to share in Community</Text>
          <Text style={styles.tipText}>• Set reminders for repairs that need ordered parts</Text>
        </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Full Repair Details Modal */}
      {selectedSession && (
        <RepairInstructionsModal
          visible={showDetailsModal}
          repairData={selectedSession}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedSession(null);
          }}
        />
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientOverlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  sessionsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  sessionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sessionNotes: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 4,
    lineHeight: 18,
  },
  sessionDate: {
    fontSize: 12,
    color: '#666',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#aaa',
    fontSize: 13,
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#00D9FF',
    fontSize: 13,
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: '#2a2a00',
    padding: 20,
    borderRadius: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  tipText: {
    color: '#fbbf24',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
});
