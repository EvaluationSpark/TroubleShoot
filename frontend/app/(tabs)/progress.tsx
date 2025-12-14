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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import InsightsSection from '../components/InsightsSection';
import RepairInstructionsModal from '../components/RepairInstructionsModal';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ProgressScreen() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<any>(null);
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

  const fetchBackendSessions = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/repair-sessions`);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching backend sessions:', error);
      return [];
    }
  };

  const fetchLocalSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem('repair_sessions');
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Error fetching local sessions:', error);
      return [];
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/repair-insights`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Insights fetch failed:', error);
      return null;
    }
  };

  const fetchSessions = async () => {
    try {
      const [backendSessions, localSessions, insightsData] = await Promise.all([
        fetchBackendSessions(),
        fetchLocalSessions(),
        fetchInsights(),
      ]);

      // Merge sessions (backend + local, deduplicate by repair_id)
      const allSessions = [...backendSessions];
      const backendIds = new Set(backendSessions.map((s: any) => s.repair_id));
      
      localSessions.forEach((localSession: any) => {
        if (!backendIds.has(localSession.repair_id)) {
          allSessions.push(localSession);
        }
      });

      // Sort by date (newest first)
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  const clearAllSessions = async () => {
    Alert.alert(
      'Clear All Repairs',
      'Are you sure you want to delete all saved repairs? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear local storage
              await AsyncStorage.removeItem('repair_sessions');
              
              // Clear backend
              try {
                await fetch(`${BACKEND_URL}/api/repair-sessions`, {
                  method: 'DELETE',
                });
              } catch (e) {
                console.log('Backend clear failed:', e);
              }
              
              // Refresh
              fetchSessions();
              Alert.alert('Success', 'All repairs have been deleted');
            } catch (error) {
              console.error('Error clearing sessions:', error);
              Alert.alert('Error', 'Failed to clear repairs');
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (session: any) => {
    // Ensure we have the repair data in the correct structure
    const repairData = session.repair_data || session;
    setSelectedSession(repairData);
    setShowDetailsModal(true);
  };

  if (loading) {
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
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00D9FF" />
              <Text style={styles.loadingText}>Loading repairs...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
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
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            style={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D9FF" />
            }
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>My Repairs</Text>
                <Text style={styles.headerSubtitle}>Track your projects & insights</Text>
              </View>
              {sessions.length > 0 && (
                <TouchableOpacity onPress={clearAllSessions} style={styles.clearButton}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            {/* Insights Section */}
            <InsightsSection insights={insights} />

            {/* Saved Repairs Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saved Repairs</Text>
              
              {sessions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="construct-outline" size={64} color="#666" />
                  <Text style={styles.emptyTitle}>No Saved Repairs</Text>
                  <Text style={styles.emptyText}>
                    When you save repair instructions, they'll appear here for easy access.
                  </Text>
                </View>
              ) : (
                sessions.map((session, index) => {
                  const title = session.title || session.item_type || 'Unknown Repair';
                  const status = session.status || 'saved';
                  const progress = session.progress_percentage || 0;
                  const date = session.updated_at || session.timestamp;
                  const formattedDate = date ? new Date(date).toLocaleDateString() : 'Unknown date';

                  return (
                    <View key={session.repair_id || index} style={styles.sessionCard}>
                      <View style={styles.sessionHeader}>
                        <View style={styles.sessionTitleContainer}>
                          <Text style={styles.sessionTitle}>{title}</Text>
                          <Text style={styles.sessionDate}>{formattedDate}</Text>
                        </View>
                        <View style={[styles.statusBadge, status === 'completed' && styles.statusCompleted]}>
                          <Text style={styles.statusText}>
                            {status === 'completed' ? '✓ Done' : '⏳ Saved'}
                          </Text>
                        </View>
                      </View>

                      {session.damage_description && (
                        <Text style={styles.sessionDescription} numberOfLines={2}>
                          {session.damage_description}
                        </Text>
                      )}

                      {progress > 0 && (
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${progress}%` }]} />
                          <Text style={styles.progressText}>{progress}% Complete</Text>
                        </View>
                      )}

                      <View style={styles.sessionActions}>
                        <TouchableOpacity
                          style={styles.viewButton}
                          onPress={() => handleViewDetails(session)}
                        >
                          <Ionicons name="eye" size={16} color="#00D9FF" />
                          <Text style={styles.viewButtonText}>View Details</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.continueButton}
                          onPress={() => handleViewDetails(session)}
                        >
                          <Ionicons name="play-circle" size={16} color="#4ade80" />
                          <Text style={styles.continueButtonText}>Continue</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </SafeAreaView>

        {/* Repair Details Modal */}
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
      </LinearGradient>
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
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTextContainer: {
    flex: 1,
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
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
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
  sessionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24',
  },
  sessionDescription: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 12,
    lineHeight: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ade80',
    borderRadius: 4,
  },
  progressText: {
    position: 'absolute',
    right: 8,
    top: -16,
    fontSize: 10,
    color: '#4ade80',
    fontWeight: '600',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    gap: 6,
  },
  viewButtonText: {
    color: '#00D9FF',
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    gap: 6,
  },
  continueButtonText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
  },
});