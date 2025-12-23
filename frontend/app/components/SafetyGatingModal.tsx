/**
 * Fix Stuff - Safety Gating Modal
 * Company: RentMouse
 * Prevents users from attempting dangerous high-risk repairs
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { RiskLevel } from '../types/models';

interface SafetyGatingModalProps {
  visible: boolean;
  riskLevel: RiskLevel;
  itemType: string;
  confidenceScore: number;
  stopAndCallPro: boolean;
  assumptions?: string[];
  onAcknowledge: () => void;
  onCallPro: () => void;
  onCancel: () => void;
}

export default function SafetyGatingModal({
  visible,
  riskLevel,
  itemType,
  confidenceScore,
  stopAndCallPro,
  assumptions = [],
  onAcknowledge,
  onCallPro,
  onCancel,
}: SafetyGatingModalProps) {
  const { theme } = useTheme();
  const [acknowledged, setAcknowledged] = useState(false);

  const getRiskColor = () => {
    switch (riskLevel) {
      case RiskLevel.Critical:
        return '#DC2626'; // Red
      case RiskLevel.High:
        return '#EA580C'; // Orange
      case RiskLevel.Medium:
        return '#F59E0B'; // Yellow
      default:
        return theme.colors.primary;
    }
  };

  const getRiskIcon = () => {
    switch (riskLevel) {
      case RiskLevel.Critical:
        return 'warning';
      case RiskLevel.High:
        return 'alert-circle';
      case RiskLevel.Medium:
        return 'information-circle';
      default:
        return 'checkmark-circle';
    }
  };

  const getRiskTitle = () => {
    if (stopAndCallPro) {
      return '⚠️ STOP - Call a Professional';
    }
    switch (riskLevel) {
      case RiskLevel.Critical:
        return '🚨 CRITICAL SAFETY WARNING';
      case RiskLevel.High:
        return '⚠️ HIGH RISK REPAIR';
      case RiskLevel.Medium:
        return '⚠️ CAUTION REQUIRED';
      default:
        return 'ℹ️ Safety Information';
    }
  };

  const getRiskMessage = () => {
    if (stopAndCallPro) {
      return `This ${itemType} repair involves SERIOUS RISKS and should ONLY be performed by a licensed professional. Attempting this repair yourself could result in:

• Severe injury or death
• Property damage or fire
• Voiding warranties
• Legal liability
• Code violations`;
    }

    if (confidenceScore < 70) {
      return `Our AI is ${confidenceScore}% confident about this diagnosis. Due to the uncertainty, we strongly recommend consulting a professional before proceeding.`;
    }

    switch (riskLevel) {
      case RiskLevel.Critical:
        return `This ${itemType} repair involves ELECTRICAL, GAS, or STRUCTURAL work that requires professional expertise. DIY attempts can be LIFE-THREATENING.`;
      case RiskLevel.High:
        return `This ${itemType} repair carries significant risks. Only proceed if you have proper training, tools, and safety equipment.`;
      case RiskLevel.Medium:
        return `This ${itemType} repair requires caution. Follow all safety instructions carefully and stop if you're unsure.`;
      default:
        return `Please read all safety tips before beginning this ${itemType} repair.`;
    }
  };

  const getEmergencyContacts = () => {
    const contacts = [];
    
    if (riskLevel === RiskLevel.Critical || stopAndCallPro) {
      contacts.push(
        { label: 'Emergency (911)', number: '911', icon: 'call', critical: true },
        { label: 'Find Local Pros', action: onCallPro, icon: 'people', critical: false }
      );
    } else {
      contacts.push(
        { label: 'Find Local Pros', action: onCallPro, icon: 'people', critical: false }
      );
    }
    
    return contacts;
  };

  const handleCallEmergency = (number: string) => {
    Alert.alert(
      'Call Emergency Services?',
      `This will dial ${number}. Only call if there is an immediate danger.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          style: 'destructive',
          onPress: () => Linking.openURL(`tel:${number}`),
        },
      ]
    );
  };

  const handleContinue = () => {
    if (stopAndCallPro) {
      Alert.alert(
        'Are You Sure?',
        'We strongly recommend you do NOT attempt this repair. Are you absolutely certain you want to proceed?',
        [
          { text: 'No, Call a Pro', style: 'cancel', onPress: onCallPro },
          { text: 'Yes, I Understand the Risks', style: 'destructive', onPress: onAcknowledge },
        ]
      );
    } else if (!acknowledged) {
      Alert.alert('Acknowledgement Required', 'Please check the box to acknowledge the risks.');
    } else {
      onAcknowledge();
    }
  };

  const riskColor = getRiskColor();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <LinearGradient
        colors={theme.gradients.background}
        style={styles.container}
      >
        <View style={styles.safeArea}>
          {/* Header */}
          <BlurView
            intensity={theme.colors.glassBlur}
            tint={theme.colors.glassTint}
            style={[styles.header, { borderColor: riskColor }]}
          >
            <View style={styles.headerContent}>
              <View style={[styles.riskIconContainer, { backgroundColor: `${riskColor}30` }]}>
                <Ionicons name={getRiskIcon()} size={32} color={riskColor} />
              </View>
              <Text style={[styles.headerTitle, { color: riskColor }]}>{getRiskTitle()}</Text>
            </View>
          </BlurView>

          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            {/* Main Warning */}
            <BlurView
              intensity={theme.colors.glassBlur}
              tint={theme.colors.glassTint}
              style={[styles.warningCard, { borderColor: riskColor, borderWidth: 2 }]}
            >
              <Text style={[styles.warningText, { color: theme.colors.text }]}>
                {getRiskMessage()}
              </Text>
            </BlurView>

            {/* Risk Details */}
            <BlurView
              intensity={theme.colors.glassBlur}
              tint={theme.colors.glassTint}
              style={[styles.detailsCard, { borderColor: theme.colors.glassBorder }]}
            >
              <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>Risk Assessment</Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Item:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{itemType}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Risk Level:</Text>
                <Text style={[styles.detailValue, { color: riskColor }]}>{riskLevel.toUpperCase()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>AI Confidence:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{confidenceScore}%</Text>
              </View>
            </BlurView>

            {/* Assumptions */}
            {assumptions.length > 0 && (
              <BlurView
                intensity={theme.colors.glassBlur}
                tint={theme.colors.glassTint}
                style={[styles.assumptionsCard, { borderColor: theme.colors.glassBorder }]}
              >
                <Text style={[styles.assumptionsTitle, { color: theme.colors.text }]}>
                  AI Assumptions:
                </Text>
                {assumptions.map((assumption, index) => (
                  <View key={index} style={styles.assumptionRow}>
                    <Ionicons name="ellipse" size={6} color={theme.colors.textSecondary} />
                    <Text style={[styles.assumptionText, { color: theme.colors.textSecondary }]}>
                      {assumption}
                    </Text>
                  </View>
                ))}
              </BlurView>
            )}

            {/* Emergency Contacts */}
            <View style={styles.contactsSection}>
              <Text style={[styles.contactsTitle, { color: theme.colors.text }]}>Get Professional Help</Text>
              {getEmergencyContacts().map((contact, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() =>
                    contact.number ? handleCallEmergency(contact.number) : contact.action?.()
                  }
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={contact.critical ? ['#DC2626', '#B91C1C'] : theme.gradients.primary}
                    style={styles.contactButton}
                  >
                    <Ionicons name={contact.icon as any} size={24} color="#fff" />
                    <Text style={styles.contactButtonText}>{contact.label}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* Acknowledgement */}
            {!stopAndCallPro && riskLevel !== RiskLevel.Critical && (
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcknowledged(!acknowledged)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, acknowledged && { backgroundColor: riskColor }]}>
                  {acknowledged && <Ionicons name="checkmark" size={20} color="#fff" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>
                  I understand the risks and have the necessary skills, tools, and safety equipment to proceed safely.
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            {!stopAndCallPro && riskLevel !== RiskLevel.Critical ? (
              <TouchableOpacity
                style={[styles.continueButton, { opacity: acknowledged ? 1 : 0.5 }]}
                onPress={handleContinue}
                disabled={!acknowledged}
              >
                <LinearGradient colors={[riskColor, riskColor]} style={styles.continueGradient}>
                  <Text style={styles.continueButtonText}>I Accept the Risk</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.proButton} onPress={onCallPro}>
                <LinearGradient colors={theme.gradients.primary} style={styles.continueGradient}>
                  <Text style={styles.continueButtonText}>Find a Professional</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    padding: 20,
    borderBottomWidth: 2,
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    gap: 12,
  },
  riskIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  warningCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  warningText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
  detailsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  assumptionsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  assumptionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  assumptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  assumptionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  contactsSection: {
    marginBottom: 20,
  },
  contactsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  contactButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  proButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueGradient: {
    padding: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
