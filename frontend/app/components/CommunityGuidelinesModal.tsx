/**
 * Fix Stuff - Community Guidelines Modal
 * Company: RentMouse
 * PR #6: Community Moderation
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';

interface CommunityGuidelinesModalProps {
  visible: boolean;
  onClose: () => void;
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CommunityGuidelinesModal({ visible, onClose }: CommunityGuidelinesModalProps) {
  const { theme } = useTheme();
  const [guidelines, setGuidelines] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      fetchGuidelines();
    }
  }, [visible]);

  const fetchGuidelines = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/community/guidelines`);
      if (response.ok) {
        const data = await response.json();
        setGuidelines(data);
      }
    } catch (error) {
      console.error('Error fetching guidelines:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <BlurView
          intensity={theme.colors.glassBlur}
          tint={theme.colors.glassTint}
          style={[styles.modalContainer, { borderColor: theme.colors.glassBorder }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {guidelines?.title || 'Community Guidelines'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : guidelines ? (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
              {/* Introduction */}
              <Text style={[styles.introduction, { color: theme.colors.textSecondary }]}>
                {guidelines.introduction}
              </Text>

              {/* Rules */}
              <View style={styles.rulesContainer}>
                {guidelines.rules?.map((rule: any, index: number) => (
                  <BlurView
                    key={index}
                    intensity={theme.colors.glassBlur}
                    tint={theme.colors.glassTint}
                    style={[styles.ruleCard, { borderColor: theme.colors.glassBorder }]}
                  >
                    <View style={styles.ruleHeader}>
                      <View style={[styles.ruleNumber, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Text style={[styles.ruleNumberText, { color: theme.colors.primary }]}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text style={[styles.ruleTitle, { color: theme.colors.text }]}>{rule.title}</Text>
                    </View>
                    <Text style={[styles.ruleDescription, { color: theme.colors.textSecondary }]}>
                      {rule.description}
                    </Text>
                  </BlurView>
                ))}
              </View>

              {/* Reporting */}
              {guidelines.reporting && (
                <BlurView
                  intensity={theme.colors.glassBlur}
                  tint={theme.colors.glassTint}
                  style={[styles.section, { borderColor: theme.colors.glassBorder }]}
                >
                  <View style={styles.sectionHeader}>
                    <Ionicons name="flag" size={20} color={theme.colors.error} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      {guidelines.reporting.title}
                    </Text>
                  </View>
                  <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
                    {guidelines.reporting.description}
                  </Text>
                  {guidelines.reporting.reasons && (
                    <View style={styles.reasonsList}>
                      {guidelines.reporting.reasons.map((reason: string, index: number) => (
                        <View key={index} style={styles.reasonItem}>
                          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                          <Text style={[styles.reasonText, { color: theme.colors.textSecondary }]}>
                            {reason}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </BlurView>
              )}

              {/* Consequences */}
              {guidelines.consequences && (
                <BlurView
                  intensity={theme.colors.glassBlur}
                  tint={theme.colors.glassTint}
                  style={[styles.section, { borderColor: theme.colors.glassBorder }]}
                >
                  <View style={styles.sectionHeader}>
                    <Ionicons name="warning" size={20} color={theme.colors.warning} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      {guidelines.consequences.title}
                    </Text>
                  </View>
                  <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
                    {guidelines.consequences.description}
                  </Text>
                </BlurView>
              )}

              {/* Close Button */}
              <TouchableOpacity style={styles.closeButtonWrapper} onPress={onClose}>
                <LinearGradient
                  colors={theme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.closeButtonGradient}
                >
                  <Text style={styles.closeButtonText}>Got It</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  content: {
    flex: 1,
  },
  introduction: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  rulesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  ruleCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  ruleNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleNumberText: {
    fontSize: 16,
    fontWeight: '700',
  },
  ruleTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  ruleDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 44,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reasonsList: {
    gap: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reasonText: {
    fontSize: 14,
  },
  closeButtonWrapper: {
    marginTop: 16,
    marginBottom: 24,
  },
  closeButtonGradient: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
