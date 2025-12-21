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
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocalVendorsModal from './LocalVendorsModal';
import VideoPlayerModal from './VideoPlayerModal';
import { CostBreakdown, TimeBreakdown } from './CostTimeBreakdown';
import { exportRepairAsPDF } from '../utils/pdfExport';
import { useUser } from '../contexts/UserContext';

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
  const [searchingParts, setSearchingParts] = useState(false);
  const [enhancedParts, setEnhancedParts] = useState<any[]>([]);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [stepVideos, setStepVideos] = useState<any[]>([]);

  // Search for real parts with purchase links
  const searchForParts = async () => {
    if (!repairData?.parts_needed || repairData.parts_needed.length === 0) {
      Alert.alert('No Parts', 'No parts are needed for this repair.');
      return;
    }

    setSearchingParts(true);
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/search-parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: repairData.item_type,
          parts_needed: repairData.parts_needed,
          model_number: repairData.model_number || '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEnhancedParts(data.parts || []);
        if (data.parts && data.parts.length > 0) {
          setShowPartsModal(true);
        } else {
          Alert.alert('No Results', 'Could not find purchase links for these parts.');
        }
      } else {
        Alert.alert('Error', 'Failed to search for parts.');
      }
    } catch (error) {
      console.error('Error searching parts:', error);
      Alert.alert('Error', 'Failed to search for parts.');
    } finally {
      setSearchingParts(false);
    }
  };

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

  const toggleStep = async (index: number) => {
    const newChecked = new Set(checkedSteps);
    const wasChecked = newChecked.has(index);
    
    if (wasChecked) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
      
      // Award XP for completing a step
      try {
        const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
        const response = await fetch(`${BACKEND_URL}/api/gamification/complete-step`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 'default_user',
            repair_id: repairData?.repair_id || 'unknown',
            step_number: index,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.xp_earned > 0) {
            // Show a small XP notification
            Alert.alert('🎮 +' + data.xp_earned + ' XP!', 'Step completed!', [
              { text: 'OK', style: 'default' }
            ]);
          }
          if (data.ranked_up && data.new_rank) {
            Alert.alert(
              '🎉 Rank Up!',
              `Congratulations! You are now a ${data.new_rank.badge} ${data.new_rank.name}!`,
              [{ text: 'Awesome!', style: 'default' }]
            );
          }
        }
      } catch (error) {
        console.log('Failed to award XP:', error);
      }
    }
    setCheckedSteps(newChecked);
  };

  // Complete entire repair project
  const completeRepairProject = async () => {
    const totalSteps = (repairData?.repair_steps || []).length;
    const completedSteps = checkedSteps.size;
    
    if (completedSteps < totalSteps) {
      Alert.alert(
        'Incomplete Repair',
        `You've completed ${completedSteps} of ${totalSteps} steps. Complete all steps to earn full XP!`,
        [
          { text: 'Continue Repair', style: 'cancel' },
          { text: 'Mark Complete Anyway', onPress: () => submitRepairCompletion() }
        ]
      );
    } else {
      submitRepairCompletion();
    }
  };

  const submitRepairCompletion = async () => {
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/gamification/complete-repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'default_user',
          repair_id: repairData?.repair_id || 'unknown',
          item_type: repairData?.item_type || 'unknown',
          total_steps: (repairData?.repair_steps || []).length,
          time_taken_minutes: 0, // Could track actual time if needed
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        let message = `You earned ${data.xp_earned} XP!`;
        
        if (data.new_achievements && data.new_achievements.length > 0) {
          const achievementNames = data.new_achievements.map((a: any) => `${a.badge} ${a.name}`).join('\n');
          message += `\n\n🏆 New Achievements:\n${achievementNames}`;
        }
        
        if (data.ranked_up && data.new_rank) {
          message += `\n\n🎉 RANK UP!\nYou are now a ${data.new_rank.badge} ${data.new_rank.name}!`;
        }
        
        Alert.alert('🎮 Repair Complete!', message, [
          { text: 'Awesome!', style: 'default' }
        ]);
      }
    } catch (error) {
      console.error('Failed to submit repair completion:', error);
    }
  };

  const getStepDetails = async (stepNumber: number, stepText: string) => {
    setSelectedStep({ number: stepNumber, text: stepText });
    setShowDetailModal(true);
    setLoadingDetails(true);
    setStepDetails('');
    setStepDiagram(null);
    setStepVideos([]);

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
        setStepDetails(data.detailed_instructions || 'No additional details available.');
        setStepDiagram(data.diagram_image || null);
        setStepVideos(data.tutorial_videos || []);
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
      <SafeAreaView style={styles.container}>
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

        {/* Repair Infographic */}
        {repairData.diagram_base64 && (
          <View style={styles.infographicContainer}>
            <Text style={styles.infographicTitle}>📊 Repair Guide Infographic</Text>
            <Image
              source={{ uri: `data:image/png;base64,${repairData.diagram_base64}` }}
              style={styles.infographicImage}
              resizeMode="contain"
            />
          </View>
        )}

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
              
              {/* Complete Repair Button */}
              <TouchableOpacity
                style={[
                  styles.completeRepairButton,
                  checkedSteps.size === (repairData.repair_steps || []).length && styles.completeRepairButtonReady
                ]}
                onPress={completeRepairProject}
              >
                <Ionicons 
                  name={checkedSteps.size === (repairData.repair_steps || []).length ? "trophy" : "flag"} 
                  size={24} 
                  color="#fff" 
                />
                <Text style={styles.completeRepairButtonText}>
                  {checkedSteps.size === (repairData.repair_steps || []).length 
                    ? '🎮 Complete Repair & Earn XP!' 
                    : `Mark Repair Complete (${checkedSteps.size}/${(repairData.repair_steps || []).length})`}
                </Text>
              </TouchableOpacity>
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
                    {part.price && (
                      <Text style={styles.partPrice}>Est. ${typeof part.price === 'number' ? part.price : part.price}</Text>
                    )}
                  </View>
                </View>
              ))}
              
              {/* Find Where to Buy Button */}
              {(repairData.parts_needed || []).length > 0 && (
                <TouchableOpacity
                  style={styles.findPartsButton}
                  onPress={searchForParts}
                  disabled={searchingParts}
                >
                  {searchingParts ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="search" size={20} color="#fff" />
                      <Text style={styles.findPartsButtonText}>Find Where to Buy</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
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
                    <View style={styles.videoThumbnailContainer}>
                      {video.thumbnail ? (
                        <Image 
                          source={{ uri: video.thumbnail }} 
                          style={styles.videoThumbnailImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.videoThumbnailPlaceholder}>
                          <Ionicons name="logo-youtube" size={32} color="#ff0000" />
                        </View>
                      )}
                      <View style={styles.playOverlay}>
                        <Ionicons name="play-circle" size={40} color="#fff" />
                      </View>
                    </View>
                    <View style={styles.videoInfo}>
                      <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                      <Text style={styles.videoDescription} numberOfLines={2}>{video.description}</Text>
                      <View style={styles.videoMeta}>
                        <Ionicons name="logo-youtube" size={14} color="#ff0000" />
                        <Text style={styles.videoChannel}>{video.channel}</Text>
                        {video.duration && (
                          <>
                            <Text style={styles.videoDuration}> • {video.duration}</Text>
                          </>
                        )}
                      </View>
                    </View>
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
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#00D9FF" />
                  <Text style={styles.loadingText}>Generating detailed breakdown and finding tutorial videos...</Text>
                </View>
              ) : (
                <ScrollView style={styles.detailScroll}>
                  {stepDiagram && (
                    <View style={styles.diagramContainer}>
                      <Image 
                        source={{ uri: `data:image/png;base64,${stepDiagram}` }} 
                        style={styles.diagramImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                  <Text style={styles.detailDescription}>{stepDetails}</Text>
                  
                  {/* Tutorial Videos for this Step */}
                  {stepVideos.length > 0 && (
                    <View style={styles.stepVideosSection}>
                      <View style={styles.stepVideoHeader}>
                        <Ionicons name="logo-youtube" size={24} color="#ff0000" />
                        <Text style={styles.stepVideosTitle}>Video Tutorials for This Step</Text>
                      </View>
                      {stepVideos.map((video: any, index: number) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.stepVideoCard}
                          onPress={() => {
                            setSelectedVideo(video);
                            setShowVideoPlayer(true);
                          }}
                        >
                          <View style={styles.stepVideoThumbnail}>
                            {video.thumbnail ? (
                              <Image 
                                source={{ uri: video.thumbnail }} 
                                style={styles.stepVideoThumbnailImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.stepVideoPlaceholder}>
                                <Ionicons name="play-circle" size={32} color="#ff0000" />
                              </View>
                            )}
                            <View style={styles.stepVideoPlayOverlay}>
                              <Ionicons name="play" size={24} color="#fff" />
                            </View>
                          </View>
                          <View style={styles.stepVideoInfo}>
                            <Text style={styles.stepVideoTitle} numberOfLines={2}>{video.title}</Text>
                            <Text style={styles.stepVideoChannel}>{video.channel}</Text>
                            {video.relevance && (
                              <Text style={styles.stepVideoRelevance} numberOfLines={2}>
                                <Ionicons name="checkmark-circle" size={12} color="#4ade80" /> {video.relevance}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
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
            videoUrl={selectedVideo.url || selectedVideo.embed_url || ''}
            videoTitle={selectedVideo.title}
            videoId={selectedVideo.video_id}
            onClose={() => {
              setShowVideoPlayer(false);
              setSelectedVideo(null);
            }}
          />
        )}

        {/* Parts Purchase Modal */}
        <Modal visible={showPartsModal} animationType="slide" onRequestClose={() => setShowPartsModal(false)}>
          <SafeAreaView style={styles.partsModalContainer}>
            <View style={styles.partsModalHeader}>
              <Text style={styles.partsModalTitle}>Where to Buy Parts</Text>
              <TouchableOpacity onPress={() => setShowPartsModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.partsModalContent}>
              {enhancedParts.map((part, index) => (
                <View key={index} style={styles.enhancedPartCard}>
                  <Text style={styles.enhancedPartName}>{part.part_name}</Text>
                  <Text style={styles.enhancedPartPrice}>{part.estimated_price_range}</Text>
                  
                  {part.tips && (
                    <View style={styles.partTipContainer}>
                      <Ionicons name="bulb" size={16} color="#fbbf24" />
                      <Text style={styles.partTipText}>{part.tips}</Text>
                    </View>
                  )}

                  {part.alternative_names && part.alternative_names.length > 0 && (
                    <Text style={styles.alternativeNames}>
                      Also known as: {part.alternative_names.join(', ')}
                    </Text>
                  )}

                  <Text style={styles.whereToBuyTitle}>Where to Buy:</Text>
                  {(part.where_to_buy || []).map((store: any, storeIndex: number) => (
                    <TouchableOpacity
                      key={storeIndex}
                      style={styles.storeButton}
                      onPress={() => Linking.openURL(store.search_url)}
                    >
                      <View style={styles.storeInfo}>
                        <Ionicons name="storefront" size={20} color="#00D9FF" />
                        <Text style={styles.storeName}>{store.store}</Text>
                      </View>
                      <View style={styles.storeAction}>
                        <Text style={styles.storeNotes}>{store.notes}</Text>
                        <Ionicons name="open-outline" size={20} color="#4ade80" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
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
  infographicContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infographicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D9FF',
    marginBottom: 12,
  },
  infographicImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#fff',
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
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  videoThumbnailContainer: {
    width: 120,
    height: 68,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  videoThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    lineHeight: 18,
  },
  videoDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
    lineHeight: 16,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  videoDuration: {
    fontSize: 12,
    color: '#aaa',
  },
  videoChannel: {
    fontSize: 12,
    color: '#aaa',
    flex: 1,
  },
  // Parts Modal Styles
  findPartsButton: {
    backgroundColor: '#4ade80',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  findPartsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeRepairButton: {
    backgroundColor: '#4b5563',
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  completeRepairButtonReady: {
    backgroundColor: '#4ade80',
  },
  completeRepairButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  partPrice: {
    fontSize: 12,
    color: '#4ade80',
    marginTop: 2,
  },
  partsModalContainer: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  partsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingTop: 50,
  },
  partsModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  partsModalContent: {
    flex: 1,
    padding: 16,
  },
  enhancedPartCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  enhancedPartName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  enhancedPartPrice: {
    fontSize: 16,
    color: '#4ade80',
    fontWeight: '600',
    marginBottom: 12,
  },
  partTipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2a2a00',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  partTipText: {
    flex: 1,
    fontSize: 14,
    color: '#fbbf24',
  },
  alternativeNames: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  whereToBuyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  storeButton: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D9FF',
  },
  storeAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeNotes: {
    fontSize: 13,
    color: '#aaa',
    flex: 1,
  },
  // Step Details Video Styles
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  stepVideosSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 20,
  },
  stepVideoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  stepVideosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepVideoCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    gap: 12,
  },
  stepVideoThumbnail: {
    width: 100,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  stepVideoThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  stepVideoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  stepVideoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  stepVideoInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  stepVideoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    lineHeight: 16,
  },
  stepVideoChannel: {
    fontSize: 11,
    color: '#ff0000',
    marginBottom: 4,
  },
  stepVideoRelevance: {
    fontSize: 11,
    color: '#4ade80',
    lineHeight: 14,
  },
});