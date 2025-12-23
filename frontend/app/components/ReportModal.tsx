/**
 * Fix Stuff - Report Modal Component
 * Company: RentMouse
 * PR #6: Community Moderation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';

interface ReportModalProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate Content', icon: 'warning' },
  { value: 'spam', label: 'Spam or Ads', icon: 'megaphone' },
  { value: 'dangerous', label: 'Dangerous Advice', icon: 'alert-circle' },
  { value: 'misleading', label: 'Misleading Information', icon: 'information-circle' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ReportModal({ visible, postId, onClose, onReportSubmitted }: ReportModalProps) {
  const { theme } = useTheme();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Select a Reason', 'Please select a reason for reporting this post.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/community/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          reason: selectedReason,
          details: details || undefined,
          reporter_name: reporterName || 'Anonymous',
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Report Submitted',
          'Thank you for helping keep our community safe. We will review this report shortly.',
          [
            {
              text: 'OK',
              onPress: () => {
                onReportSubmitted?.();
                handleClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDetails('');
    setReporterName('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <BlurView
          intensity={theme.colors.glassBlur}
          tint={theme.colors.glassTint}
          style={[styles.modalContainer, { borderColor: theme.colors.glassBorder }]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="flag" size={24} color={theme.colors.error} />
                <Text style={[styles.title, { color: theme.colors.text }]}>Report Post</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Help us keep the community safe by reporting content that violates our guidelines.
            </Text>

            {/* Reason Selection */}
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Select a Reason *</Text>
            <View style={styles.reasonsContainer}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  style={[
                    styles.reasonButton,
                    {
                      borderColor: selectedReason === reason.value ? theme.colors.error : theme.colors.glassBorder,
                      backgroundColor:
                        selectedReason === reason.value
                          ? `${theme.colors.error}20`
                          : theme.mode === 'dark'
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.05)',
                    },
                  ]}
                  onPress={() => setSelectedReason(reason.value)}
                >
                  <Ionicons
                    name={reason.icon as any}
                    size={20}
                    color={selectedReason === reason.value ? theme.colors.error : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.reasonLabel,
                      {
                        color: selectedReason === reason.value ? theme.colors.error : theme.colors.text,
                      },
                    ]}
                  >
                    {reason.label}
                  </Text>
                  {selectedReason === reason.value && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.error} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Additional Details */}
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Additional Details (Optional)</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.glassBorder,
                  backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                },
              ]}
              placeholder="Provide more context about the issue..."
              placeholderTextColor={theme.colors.textTertiary}
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Reporter Name */}
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Your Name (Optional)</Text>
            <TextInput
              style={[
                styles.nameInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.glassBorder,
                  backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                },
              ]}
              placeholder="Anonymous"
              placeholderTextColor={theme.colors.textTertiary}
              value={reporterName}
              onChangeText={setReporterName}
            />

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButtonWrapper} onPress={handleClose} disabled={submitting}>
                <BlurView
                  intensity={theme.colors.glassBlur}
                  tint={theme.colors.glassTint}
                  style={[styles.cancelButton, { borderColor: theme.colors.glassBorder }]}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButtonWrapper}
                onPress={handleSubmit}
                disabled={submitting || !selectedReason}
              >
                <LinearGradient
                  colors={
                    submitting || !selectedReason
                      ? ['#666', '#888']
                      : [theme.colors.error, theme.colors.error + 'CC']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitButton}
                >
                  <Ionicons name="flag" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit Report'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    maxWidth: 500,
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
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  reasonsContainer: {
    gap: 8,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    height: 48,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButtonWrapper: {
    flex: 1,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonWrapper: {
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
