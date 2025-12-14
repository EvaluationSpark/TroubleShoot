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
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocalVendorsModal from './LocalVendorsModal';
import { CostBreakdown, TimeBreakdown } from './CostTimeBreakdown';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const REPAIRS_STORAGE_KEY = '@pix_fix_repairs';

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
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<{number: number, text: string} | null>(null);
  const [stepDetails, setStepDetails] = useState<string>('');
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  const toggleStep = (stepIndex: number) => {
    const newChecked = new Set(checkedSteps);
    if (newChecked.has(stepIndex)) {
      newChecked.delete(stepIndex);
    } else {
      newChecked.add(stepIndex);
    }
    setCheckedSteps(newChecked);
  };

  const getMoreHelp = async (stepNumber: number, stepText: string) => {
    setSelectedStep({ number: stepNumber, text: stepText });
    setShowDetailModal(true);
    setLoadingDetails(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/get-step-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: repairData.item_type,
          step_text: stepText,
          step_number: stepNumber,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStepDetails(data.detailed_explanation);
      } else {
        Alert.alert('Error', 'Failed to get detailed explanation');
      }
    } catch (error) {
      console.error('Error getting step details:', error);
      Alert.alert('Error', 'Failed to get detailed explanation');
    } finally {
      setLoadingDetails(false);
    }
  };

  const parseDetailedInstructions = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Section headers (bold text with **)
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        const headerText = trimmed.replace(/\*\*/g, '');
        elements.push(
          <Text key={key++} style={styles.detailSectionHeader}>
            {headerText}
          </Text>
        );
      }
      // Numbered lists (1., 2., etc.)
      else if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s(.+)$/);
        if (match) {
          elements.push(
            <View key={key++} style={styles.detailNumberedItem}>
              <View style={styles.detailNumberBadge}>
                <Text style={styles.detailNumberText}>{match[1]}</Text>
              </View>
              <Text style={styles.detailItemText}>{match[2]}</Text>
            </View>
          );
        }
      }
      // Bullet points (-, •, or *)
      else if (/^[-•\*]\s/.test(trimmed)) {
        const text = trimmed.replace(/^[-•\*]\s/, '');
        elements.push(
          <View key={key++} style={styles.detailBulletItem}>
            <View style={styles.detailBulletDot} />
            <Text style={styles.detailItemText}>{text}</Text>
          </View>
        );
      }
      // Warning/Caution text (starts with ⚠️ or Warning:)
      else if (trimmed.startsWith('⚠️') || trimmed.toLowerCase().startsWith('warning:') || trimmed.toLowerCase().startsWith('caution:')) {
        elements.push(
          <View key={key++} style={styles.detailWarningBox}>
            <Ionicons name="warning" size={20} color="#fbbf24" />
            <Text style={styles.detailWarningText}>{trimmed}</Text>
          </View>
        );
      }
      // Tip text (starts with 💡 or Tip:)
      else if (trimmed.startsWith('💡') || trimmed.toLowerCase().startsWith('tip:')) {
        elements.push(
          <View key={key++} style={styles.detailTipBox}>
            <Ionicons name="bulb" size={20} color="#00D9FF" />
            <Text style={styles.detailTipText}>{trimmed}</Text>
          </View>
        );
      }
      // Regular paragraph
      else {
        elements.push(
          <Text key={key++} style={styles.detailParagraph}>
            {trimmed}
          </Text>
        );
      }
    });

    return elements;
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

  const generateRepairTitle = () => {
    // Auto-generate title from item type and damage description
    const itemType = repairData.item_type || 'Item';
    const damage = repairData.damage_description || 'Repair';
    return `${itemType} - ${damage.substring(0, 50)}${damage.length > 50 ? '...' : ''}`;
  };

  const saveToAsyncStorage = async (repairSession: any) => {
    try {
      const existingRepairs = await AsyncStorage.getItem(REPAIRS_STORAGE_KEY);
      const repairs = existingRepairs ? JSON.parse(existingRepairs) : [];
      repairs.unshift(repairSession); // Add to beginning of array
      await AsyncStorage.setItem(REPAIRS_STORAGE_KEY, JSON.stringify(repairs));
      console.log('Saved to AsyncStorage:', repairSession.id);
    } catch (error) {
      console.error('Error saving to AsyncStorage:', error);
    }
  };

  const startRepair = async () => {
    try {
      const title = generateRepairTitle();
      const repairSession = {
        id: `local_${Date.now()}`,
        repair_id: repairData.repair_id,
        title: title,
        notes: repairData.damage_description,
        progress_percentage: 0,
        timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Store full repair data for offline access
        item_type: repairData.item_type,
        repair_steps: repairData.repair_steps,
        tools_needed: repairData.tools_needed,
        parts_needed: repairData.parts_needed,
        diagram_base64: repairData.diagram_base64,
        repair_difficulty: repairData.repair_difficulty,
        estimated_time: repairData.estimated_time,
      };

      // Save to backend
      try {
        await fetch(`${BACKEND_URL}/api/save-repair-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repair_id: repairData.repair_id,
            title: title,
            notes: repairData.damage_description,
            progress_percentage: 0,
          }),
        });
      } catch (backendError) {
        console.log('Backend save failed, continuing with local save');
      }

      // Save to local storage (always)
      await saveToAsyncStorage(repairSession);

      Alert.alert(
        '🔧 Repair Started!',
        `"${title}" has been saved. Track your progress in the Progress tab.`,
        [{ text: 'Got it!', style: 'default' }]
      );
    } catch (error) {
      console.error('Error starting repair:', error);
      Alert.alert('Error', 'Failed to start repair session');
    }
  };

  const saveForLater = async () => {
    try {
      const title = generateRepairTitle();
      const repairSession = {
        id: `local_${Date.now()}`,
        repair_id: repairData.repair_id,
        title: title,
        notes: 'Saved for later review',
        progress_percentage: 0,
        timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        saved_for_later: true,
        // Store full repair data
        item_type: repairData.item_type,
        repair_steps: repairData.repair_steps,
        tools_needed: repairData.tools_needed,
        parts_needed: repairData.parts_needed,
        diagram_base64: repairData.diagram_base64,
        repair_difficulty: repairData.repair_difficulty,
        estimated_time: repairData.estimated_time,
      };

      // Save to backend
      try {
        await fetch(`${BACKEND_URL}/api/save-repair-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repair_id: repairData.repair_id,
            title: title,
            notes: 'Saved for later review',
            progress_percentage: 0,
          }),
        });
      } catch (backendError) {
        console.log('Backend save failed, continuing with local save');
      }

      // Save to local storage (always)
      await saveToAsyncStorage(repairSession);

      Alert.alert(
        '📌 Saved for Later!',
        `"${title}" has been bookmarked. Access it anytime from the Progress tab.`,
        [{ text: 'Got it!', style: 'default' }]
      );
    } catch (error) {
      console.error('Error saving for later:', error);
      Alert.alert('Error', 'Failed to save repair');
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

  const searchAmazon = async (itemName: string) => {
    try {
      // Create Amazon search query with item type for better results
      const searchQuery = `${itemName} ${repairData.item_type} repair part`;
      const encodedQuery = encodeURIComponent(searchQuery);
      const amazonUrl = `https://www.amazon.com/s?k=${encodedQuery}`;
      
      const supported = await Linking.canOpenURL(amazonUrl);
      if (supported) {
        await Linking.openURL(amazonUrl);
      } else {
        Alert.alert('Error', 'Unable to open Amazon');
      }
    } catch (error) {
      console.error('Error opening Amazon:', error);
      Alert.alert('Error', 'Failed to open Amazon search');
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
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Repair Steps</Text>
                <Text style={styles.progressText}>
                  {checkedSteps.size} / {repairData.repair_steps.length} completed
                </Text>
              </View>
              {repairData.repair_steps.map((step: string, index: number) => (
                <View key={index} style={[styles.stepContainer, checkedSteps.has(index) && styles.stepCompleted]}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => toggleStep(index)}
                  >
                    <Ionicons
                      name={checkedSteps.has(index) ? 'checkbox' : 'square-outline'}
                      size={28}
                      color={checkedSteps.has(index) ? '#4ade80' : '#666'}
                    />
                  </TouchableOpacity>
                  <View style={styles.stepContent}>
                    <View style={styles.stepHeader}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.stepText, checkedSteps.has(index) && styles.stepTextCompleted]}>
                        {step}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.helpButton}
                      onPress={() => getMoreHelp(index + 1, step)}
                    >
                      <Ionicons name="help-circle" size={20} color="#00D9FF" />
                      <Text style={styles.helpButtonText}>More Help</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'tools' && (
            <View style={styles.tabContent}>
                {/* Cost & Time Breakdowns */}
                <CostBreakdown costEstimate={repairData.cost_estimate} />
                <TimeBreakdown timeEstimate={repairData.time_estimate} />
                
              <Text style={styles.sectionTitle}>Tools Needed</Text>
              {repairData.tools_needed.map((tool: string, index: number) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="build" size={18} color="#00D9FF" />
                  <Text style={styles.listItemText}>{tool}</Text>
                  <TouchableOpacity 
                    style={styles.amazonButton}
                    onPress={() => searchAmazon(tool)}
                  >
                    <Ionicons name="cart" size={16} color="#ffa500" />
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Parts Needed</Text>
              {repairData.parts_needed.map((part: any, index: number) => (
                <View key={index} style={styles.partItem}>
                  <View style={styles.partInfo}>
                    <Ionicons name="hardware-chip" size={18} color="#00D9FF" />
                    <View style={styles.partTextContainer}>
                      <Text style={styles.listItemText}>{part.name}</Text>
                      {part.price && <Text style={styles.priceText}>{part.price}</Text>}
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.amazonBuyButton}
                    onPress={() => searchAmazon(part.name)}
                  >
                    <Ionicons name="cart" size={18} color="#fff" />
                    <Text style={styles.amazonBuyText}>Buy on Amazon</Text>
                  </TouchableOpacity>
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

          {/* Save Session - New Buttons */}
          <View style={styles.actionSection}>
            <Text style={styles.actionSectionTitle}>Save This Repair</Text>
            <Text style={styles.actionSectionSubtitle}>Track your progress or save for future reference</Text>
            
            <View style={styles.saveButtonsContainer}>
              <TouchableOpacity style={styles.startRepairButton} onPress={startRepair}>
                <View style={styles.buttonIcon}>
                  <Ionicons name="play-circle" size={24} color="#fff" />
                </View>
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonTitle}>Start Repair</Text>
                  <Text style={styles.buttonSubtitle}>Begin tracking progress</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveForLaterButton} onPress={saveForLater}>
                <View style={styles.buttonIcon}>
                  <Ionicons name="bookmark" size={24} color="#00D9FF" />
                </View>
                <View style={styles.buttonContent}>
                  <Text style={[styles.buttonTitle, { color: '#00D9FF' }]}>Save for Later</Text>
                  <Text style={[styles.buttonSubtitle, { color: '#aaa' }]}>Bookmark for future use</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#00D9FF" />
              </TouchableOpacity>
            </View>
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

        {/* Local Vendors Modal */}
        <LocalVendorsModal
          visible={showVendorsModal}
          itemType={repairData.item_type}
          repairData={repairData}
          onClose={() => setShowVendorsModal(false)}
        />

        {/* Step Detail Modal */}
        <Modal visible={showDetailModal} animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
          <View style={styles.detailModalContainer}>
            <View style={styles.detailModalHeader}>
              <View>
                <Text style={styles.detailModalTitle}>Step {selectedStep?.number}</Text>
                <Text style={styles.detailModalSubtitle}>Detailed Instructions</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.detailModalContent} contentContainerStyle={styles.detailScrollContent}>
              {selectedStep && (
                <View style={styles.stepSummaryCard}>
                  <Text style={styles.stepSummaryText}>{selectedStep.text}</Text>
                </View>
              )}

              {loadingDetails ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#00D9FF" />
                  <Text style={styles.loadingText}>Getting detailed instructions...</Text>
                </View>
              ) : (
                <View style={styles.detailContent}>
                  {parseDetailedInstructions(stepDetails)}
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#4ade80',
    fontWeight: '600',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
  },
  stepCompleted: {
    opacity: 0.6,
    backgroundColor: '#1a2a1a',
  },
  checkbox: {
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
  stepTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00D9FF',
  },
  helpButtonText: {
    color: '#00D9FF',
    fontSize: 13,
    fontWeight: '600',
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
  amazonButton: {
    padding: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffa500',
  },
  partItem: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  partInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  partTextContainer: {
    flex: 1,
  },
  priceText: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  amazonBuyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#ff9900',
    borderRadius: 8,
  },
  amazonBuyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  optionsSection: {
    marginBottom: 32,
  },
  optionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  vendorCard: {
    backgroundColor: '#2a2a00',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#002a33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorIcon: {
    backgroundColor: '#3a3000',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
  },
  actionSection: {
    marginBottom: 32,
  },
  actionSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  actionSectionSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 16,
  },
  saveButtonsContainer: {
    gap: 12,
  },
  startRepairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00D9FF',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveForLaterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#00D9FF',
  },
  buttonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  buttonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
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
  detailModalContainer: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingTop: 50,
  },
  detailModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D9FF',
  },
  detailModalSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  detailModalContent: {
    flex: 1,
  },
  detailScrollContent: {
    padding: 20,
  },
  stepSummaryCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#00D9FF',
  },
  stepSummaryText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 16,
  },
  detailContent: {
    paddingBottom: 20,
  },
  detailSectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00D9FF',
    marginTop: 24,
    marginBottom: 12,
  },
  detailNumberedItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  detailNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailBulletItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  detailBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D9FF',
    marginTop: 8,
  },
  detailItemText: {
    flex: 1,
    color: '#ccc',
    fontSize: 15,
    lineHeight: 24,
  },
  detailParagraph: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  detailWarningBox: {
    flexDirection: 'row',
    backgroundColor: '#2a2000',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#fbbf24',
    gap: 12,
    marginBottom: 16,
  },
  detailWarningText: {
    flex: 1,
    color: '#fbbf24',
    fontSize: 14,
    lineHeight: 22,
  },
  detailTipBox: {
    flexDirection: 'row',
    backgroundColor: '#002a33',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00D9FF',
    gap: 12,
    marginBottom: 16,
  },
  detailTipText: {
    flex: 1,
    color: '#00D9FF',
    fontSize: 14,
    lineHeight: 22,
  },
});
