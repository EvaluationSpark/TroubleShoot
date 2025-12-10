import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LocalVendorsModal from './LocalVendorsModal';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface RepairInstructionsModalProps {
  visible: boolean;
  repairData: any;
  onClose: () => void;
}

export default function RepairInstructionsModal({
  visible,
  repairData,
  onClose,
}: RepairInstructionsModalProps) {
  const [activeTab, setActiveTab] = useState<'instructions' | 'tools' | 'safety'>('instructions');
  const [rating, setRating] = useState(0);
  const [sessionTitle, setSessionTitle] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [showVendorsModal, setShowVendorsModal] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#4ade80';
      case 'medium':
        return '#fbbf24';
      case 'hard':
        return '#f87171';
      default:
        return '#aaa';
    }
  };

  const submitFeedback = async (helpful: boolean) => {
    try {
      await fetch(`${BACKEND_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repair_id: repairData.repair_id,
          rating: rating,
          was_helpful: helpful,
        }),
      });
      Alert.alert('Thank You!', 'Your feedback has been submitted.');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const saveSession = async () => {
    if (!sessionTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for this repair session');
      return;
    }

    try {
      await fetch(`${BACKEND_URL}/api/save-repair-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repair_id: repairData.repair_id,
          title: sessionTitle,
          progress_percentage: 0,
        }),
      });
      Alert.alert('Success', 'Repair session saved! Check the Progress tab.');
      setShowSaveForm(false);
      setSessionTitle('');
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save session');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Repair Guide</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Item Info */}
          <View style={styles.infoCard}>
            <Text style={styles.itemType}>{repairData.item_type}</Text>
            <Text style={styles.damageDescription}>{repairData.damage_description}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="speedometer" size={20} color={getDifficultyColor(repairData.repair_difficulty)} />
                <Text style={[styles.metaText, { color: getDifficultyColor(repairData.repair_difficulty) }]}>
                  {repairData.repair_difficulty}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={20} color="#00D9FF" />
                <Text style={styles.metaText}>{repairData.estimated_time}</Text>
              </View>
            </View>
          </View>

          {/* Diagram */}
          {repairData.diagram_base64 && (
            <View style={styles.diagramContainer}>
              <Text style={styles.sectionTitle}>Repair Diagram</Text>
              <Image
                source={{ uri: `data:image/png;base64,${repairData.diagram_base64}` }}
                style={styles.diagram}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'instructions' && styles.activeTab]}
              onPress={() => setActiveTab('instructions')}
            >
              <Text style={[styles.tabText, activeTab === 'instructions' && styles.activeTabText]}>
                Instructions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'tools' && styles.activeTab]}
              onPress={() => setActiveTab('tools')}
            >
              <Text style={[styles.tabText, activeTab === 'tools' && styles.activeTabText]}>
                Tools & Parts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'safety' && styles.activeTab]}
              onPress={() => setActiveTab('safety')}
            >
              <Text style={[styles.tabText, activeTab === 'safety' && styles.activeTabText]}>
                Safety
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'instructions' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Repair Steps</Text>
              {repairData.repair_steps.map((step: string, index: number) => (
                <View key={index} style={styles.stepContainer}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'tools' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Tools Needed</Text>
              {repairData.tools_needed.map((tool: string, index: number) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="build" size={18} color="#00D9FF" />
                  <Text style={styles.listItemText}>{tool}</Text>
                </View>
              ))}

              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Parts Needed</Text>
              {repairData.parts_needed.map((part: any, index: number) => (
                <View key={index} style={styles.partItem}>
                  <View style={styles.partInfo}>
                    <Ionicons name="hardware-chip" size={18} color="#00D9FF" />
                    <Text style={styles.listItemText}>{part.name}</Text>
                  </View>
                  {part.price && <Text style={styles.priceText}>{part.price}</Text>}
                  {part.link && (
                    <TouchableOpacity style={styles.linkButton}>
                      <Ionicons name="cart" size={16} color="#00D9FF" />
                      <Text style={styles.linkText}>Buy</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {activeTab === 'safety' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Safety Tips</Text>
              {repairData.safety_tips.map((tip: string, index: number) => (
                <View key={index} style={styles.safetyItem}>
                  <Ionicons name="warning" size={20} color="#fbbf24" />
                  <Text style={styles.safetyText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Options: DIY or Get Professional Help */}
          <View style={styles.optionsSection}>
            <Text style={styles.optionsTitle}>Choose Your Approach</Text>
            
            <TouchableOpacity style={styles.optionCard}>
              <View style={styles.optionIcon}>
                <Ionicons name="build" size={32} color="#00D9FF" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>DIY Repair</Text>
                <Text style={styles.optionDescription}>Follow our step-by-step guide and fix it yourself</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionCard, styles.vendorCard]} 
              onPress={() => setShowVendorsModal(true)}
            >
              <View style={[styles.optionIcon, styles.vendorIcon]}>
                <Ionicons name="business" size={32} color="#fbbf24" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Get Professional Help</Text>
                <Text style={styles.optionDescription}>Find local repair shops near you</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Save Session */}
          <View style={styles.actionSection}>
            {!showSaveForm ? (
              <TouchableOpacity style={styles.saveButton} onPress={() => setShowSaveForm(true)}>
                <Ionicons name="bookmark" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save for Later</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.saveForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter repair title..."
                  placeholderTextColor="#666"
                  value={sessionTitle}
                  onChangeText={setSessionTitle}
                />
                <View style={styles.saveFormButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowSaveForm(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmButton} onPress={saveSession}>
                    <Text style={styles.confirmButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Feedback */}
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>Was this helpful?</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= rating ? '#fbbf24' : '#555'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.feedbackButtons}>
              <TouchableOpacity style={styles.feedbackButton} onPress={() => submitFeedback(true)}>
                <Ionicons name="thumbs-up" size={20} color="#4ade80" />
                <Text style={styles.feedbackButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.feedbackButton} onPress={() => submitFeedback(false)}>
                <Ionicons name="thumbs-down" size={20} color="#f87171" />
                <Text style={styles.feedbackButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  itemType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D9FF',
    marginBottom: 8,
  },
  damageDescription: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 16,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  diagramContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  diagram: {
    width: '100%',
    height: 250,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#00D9FF',
  },
  tabText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    marginBottom: 32,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepText: {
    flex: 1,
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  listItemText: {
    color: '#ccc',
    fontSize: 15,
    flex: 1,
  },
  partItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  partInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  priceText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
  },
  linkText: {
    color: '#00D9FF',
    fontSize: 12,
    fontWeight: '600',
  },
  safetyItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#2a1a00',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#fbbf24',
  },
  safetyText: {
    flex: 1,
    color: '#fbbf24',
    fontSize: 14,
    lineHeight: 20,
  },
  actionSection: {
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveForm: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  saveFormButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#00D9FF',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackSection: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  feedbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
