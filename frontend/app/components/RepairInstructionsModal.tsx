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
import VideoPlayerModal from './VideoPlayerModal';
import { CostBreakdown, TimeBreakdown } from './CostTimeBreakdown';
import { exportRepairAsPDF } from '../utils/pdfExport';

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
  const [activeTab, setActiveTab] = useState('steps');
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<{number: number, text: string} | null>(null);
  const [stepDetails, setStepDetails] = useState<string>('');
  const [stepDiagram, setStepDiagram] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false); // PR #7
  const [showVendorsModal, setShowVendorsModal] = useState(false); // Local vendors feature
  const [tutorialVideos, setTutorialVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  // PR #7: Export to PDF
  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      await exportRepairAsPDF(repairData);
      Alert.alert('Success', 'Repair guide exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Could not export the repair guide. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  // Function to clean markup from text (remove HTML/markdown tags)
  const cleanMarkup = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove markdown links
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/\n\n+/g, '\n') // Replace multiple newlines with single
      .trim();
  };

  // Fetch tutorial videos when modal opens
  React.useEffect(() => {
    if (visible && repairData && tutorialVideos.length === 0) {
      fetchTutorialVideos();
    }
  }, [visible, repairData]);

  const fetchTutorialVideos = async () => {
    if (!repairData?.item_type) return;
    
    setLoadingVideos(true);
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/get-tutorial-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: repairData.item_type,
          damage_description: repairData.damage_description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTutorialVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    if (!difficulty) return '#fbbf24'; // Default to medium if undefined
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#4ade80';
      case 'medium':
        return '#fbbf24';
      case 'hard':
        return '#ef4444';
      default:
        return '#fbbf24';
    }
  };

  const toggleStep = (index: number) => {
    const newChecked = new Set(checkedSteps);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedSteps(newChecked);
  };

  const getStepDetails = async (stepNumber: number, stepText: string) => {
    setSelectedStep({ number: stepNumber, text: stepText });
    setShowDetailModal(true);
    setLoadingDetails(true);
    setStepDetails('');
    setStepDiagram(null);

    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/get-step-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_number: stepNumber,
          step_text: stepText,
          item_type: repairData?.item_type || 'Unknown',
          repair_type: repairData?.damage_description || '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStepDetails(data.detailed_explanation || 'No additional details available.');
        setStepDiagram(data.diagram_image || null);
      } else {
        setStepDetails('Unable to fetch details. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching step details:', error);
      setStepDetails('Unable to fetch details. Please try again.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveForLater = async () => {
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      
      // Save to backend
      await fetch(`${BACKEND_URL}/api/save-repair-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repair_id: repairData.repair_id,
          title: `${repairData.item_type} Repair`,
          repair_data: repairData, // Save complete repair data
          status: 'saved',
          progress_percentage: 0,
          notes: '',
        }),
      });

      // Also save locally
      const existingSessions = await AsyncStorage.getItem('repair_sessions');
      const sessions = existingSessions ? JSON.parse(existingSessions) : [];
      
      const sessionData = {
        repair_id: repairData.repair_id,
        title: `${repairData.item_type} Repair`,
        ...repairData, // Include all repair data
        status: 'saved',
        progress_percentage: 0,
        updated_at: new Date().toISOString(),
      };
      
      sessions.push(sessionData);
      await AsyncStorage.setItem('repair_sessions', JSON.stringify(sessions));

      Alert.alert('Success', 'Repair saved for later!');
      onClose();
    } catch (error) {
      console.error('Error saving repair:', error);
      Alert.alert('Error', 'Failed to save repair. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Repair Guide</Text>
          <View style={styles.headerActions}>
            {/* PR #7: Export PDF Button */}
            <TouchableOpacity 
              onPress={handleExportPDF} 
              disabled={exportingPDF}
              style={styles.exportButton}
            >
              {exportingPDF ? (
                <ActivityIndicator size="small" color="#00D9FF" />
              ) : (
                <Ionicons name="share-outline" size={24} color="#00D9FF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Item Info */}
        <View style={styles.itemInfoCard}>
          <View style={styles.itemInfoHeader}>
            <Text style={styles.itemType}>{repairData.item_type || 'Unknown Item'}</Text>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(repairData.repair_difficulty) + '20' },
              ]}
            >
              <Text style={[styles.difficultyText, { color: getDifficultyColor(repairData.repair_difficulty) }]}>
                {(repairData.repair_difficulty || 'medium').toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.damageDescription}>{repairData.damage_description || 'No description available'}</Text>
          <View style={styles.estimatedTimeRow}>
            <Ionicons name="time" size={16} color="#00D9FF" />
            <Text style={styles.estimatedTime}>Est. Time: {repairData.estimated_time || 'Unknown'}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'steps' && styles.activeTab]}
            onPress={() => setActiveTab('steps')}
          >
            <Text style={[styles.tabText, activeTab === 'steps' && styles.activeTabText]}>Steps</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tools' && styles.activeTab]}
            onPress={() => setActiveTab('tools')}
          >
            <Text style={[styles.tabText, activeTab === 'tools' && styles.activeTabText]}>Tools & Parts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'safety' && styles.activeTab]}
            onPress={() => setActiveTab('safety')}
          >
            <Text style={[styles.tabText, activeTab === 'safety' && styles.activeTabText]}>Safety</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
            onPress={() => setActiveTab('videos')}
          >
            <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>Videos</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'steps' && (
            <View style={styles.tabContent}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Repair Steps</Text>
                <Text style={styles.progressText}>
                  {checkedSteps.size} / {(repairData.repair_steps || []).length} completed
                </Text>
              </View>
              {(repairData.repair_steps || []).map((step: any, index: number) => (
                <View key={index} style={[styles.stepContainer, checkedSteps.has(index) && styles.stepCompleted]}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => toggleStep(index)}
                  >
                    <View style={[styles.checkboxInner, checkedSteps.has(index) && styles.checkboxChecked]}>
                      {checkedSteps.has(index) && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepNumber}>Step {index + 1}</Text>
                    <Text style={styles.stepText}>{cleanMarkup(typeof step === 'string' ? step : step.title || step.step || 'No description')}</Text>
                    {step.description && <Text style={styles.stepDescription}>{cleanMarkup(step.description)}</Text>}
                    <TouchableOpacity
                      style={styles.moreDetailsButton}
                      onPress={() => getStepDetails(index + 1, typeof step === 'string' ? step : step.title || step.step)}
                    >
                      <Text style={styles.moreDetailsText}>More Details</Text>
                      <Ionicons name="chevron-forward" size={16} color="#00D9FF" />
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
              {(repairData.tools_needed || []).map((tool: any, index: number) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="construct" size={20} color="#00D9FF" />
                  <Text style={styles.listItemText}>{typeof tool === 'string' ? tool : tool.name || tool.tool || 'Unknown tool'}</Text>
                </View>
              ))}

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Parts & Materials</Text>
              {(repairData.parts_needed || []).map((part: any, index: number) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="cube" size={20} color="#fbbf24" />
                  <View style={styles.partInfo}>
                    <Text style={styles.listItemText}>{typeof part === 'string' ? part : part.name || part.part || 'Unknown part'}</Text>
                    {part.link && (
                      <TouchableOpacity onPress={() => Linking.openURL(part.link)}>
                        <Text style={styles.linkText}>Buy on Amazon</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'safety' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Safety Tips</Text>
              {(repairData.safety_tips || []).map((tip: string, index: number) => (
                <View key={index} style={styles.safetyItem}>
                  <Ionicons name="warning" size={20} color="#ef4444" />
                  <Text style={styles.safetyText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'videos' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Tutorial Videos</Text>
              {loadingVideos ? (
                <ActivityIndicator size="large" color="#00D9FF" style={{ marginTop: 20 }} />
              ) : tutorialVideos.length === 0 ? (
                <View style={styles.emptyVideos}>
                  <Ionicons name="videocam-outline" size={48} color="#666" />
                  <Text style={styles.emptyVideosText}>No videos available yet</Text>
                </View>
              ) : (
                tutorialVideos.map((video: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.videoCard}
                    onPress={() => {
                      setSelectedVideo(video);
                      setShowVideoPlayer(true);
                    }}
                  >
                    <View style={styles.videoThumbnail}>
                      <Ionicons name="play-circle" size={48} color="#00D9FF" />
                    </View>
                    <View style={styles.videoInfo}>
                      <Text style={styles.videoTitle}>{video.title}</Text>
                      <Text style={styles.videoDescription}>{video.description}</Text>
                      <View style={styles.videoMeta}>
                        <Ionicons name="time-outline" size={14} color="#aaa" />
                        <Text style={styles.videoDuration}>{video.duration}</Text>
                        <Ionicons name="person-outline" size={14} color="#aaa" style={{ marginLeft: 12 }} />
                        <Text style={styles.videoChannel}>{video.channel}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveForLater}>
            <Ionicons name="bookmark" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save for Later</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.vendorButton} onPress={() => setShowVendorsModal(true)}>
            <Ionicons name="business" size={20} color="#fff" />
            <Text style={styles.vendorButtonText}>Find Local Pros</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* Step Details Modal */}
        <Modal visible={showDetailModal} animationType="slide" transparent>
          <View style={styles.detailModalOverlay}>
            <View style={styles.detailModalContent}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>Step {selectedStep?.number}</Text>
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.detailStepText}>{selectedStep?.text}</Text>
              {loadingDetails ? (
                <ActivityIndicator size="large" color="#00D9FF" style={{ marginTop: 20 }} />
              ) : (
                <ScrollView style={styles.detailScroll}>
                  {stepDiagram && (
                    <View style={styles.diagramContainer}>
                      <Image 
                        source={{ uri: stepDiagram }} 
                        style={styles.diagramImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                  <Text style={styles.detailDescription}>{stepDetails}</Text>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Local Vendors Modal */}
        <LocalVendorsModal
          visible={showVendorsModal}
          itemType={repairData?.item_type || 'Unknown'}
          repairData={repairData}
          onClose={() => setShowVendorsModal(false)}
        />

        {/* Video Player Modal */}
        {selectedVideo && (
          <VideoPlayerModal
            visible={showVideoPlayer}
            videoUrl={selectedVideo.url}
            videoTitle={selectedVideo.title}
            onClose={() => {
              setShowVideoPlayer(false);
              setSelectedVideo(null);
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfoCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  damageDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  estimatedTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  estimatedTime: {
    fontSize: 14,
    color: '#00D9FF',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00D9FF',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#00D9FF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#00D9FF',
  },
  stepContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  stepCompleted: {
    borderColor: '#4ade80',
    backgroundColor: '#1a2a1a',
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4ade80',
    borderColor: '#4ade80',
  },
  stepContent: {
    flex: 1,
  },
  stepNumber: {
    fontSize: 12,
    color: '#00D9FF',
    fontWeight: '600',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  moreDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  moreDetailsText: {
    fontSize: 14,
    color: '#00D9FF',
    marginRight: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 8,
  },
  listItemText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 12,
    flex: 1,
  },
  partInfo: {
    flex: 1,
    marginLeft: 12,
  },
  linkText: {
    fontSize: 12,
    color: '#00D9FF',
    marginTop: 4,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#2a1a1a',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  safetyText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 12,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#00D9FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  vendorButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4ade80',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  vendorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 20,
  },
  detailModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00D9FF',
  },
  detailStepText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  detailScroll: {
    maxHeight: 300,
  },
  detailDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
  },
  diagramContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  diagramImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  emptyVideos: {
    alignItems: 'center',
    padding: 40,
  },
  emptyVideosText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
  },
  videoThumbnail: {
    width: 80,
    height: 60,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 6,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoDuration: {
    fontSize: 12,
    color: '#aaa',
  },
  videoChannel: {
    fontSize: 12,
    color: '#aaa',
  },
});