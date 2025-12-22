import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  ImageBackground,
  Animated,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import RepairInstructionsModal from '../components/RepairInstructionsModal';
import DiagnosticQuestionsModal from '../components/DiagnosticQuestionsModal';
import SafetyGatingModal from '../components/SafetyGatingModal';
import GamificationCard from '../components/GamificationCard';
import { useTheme } from '../contexts/ThemeContext';
import { useSkillLevel } from '../contexts/SkillLevelContext';
import { useLanguage } from '../contexts/LanguageContext';
import { RiskLevel } from '../types/models';
import { useResponsive } from '../hooks/useResponsive';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HomeScreen() {
  const { theme } = useTheme();
  const { skillLevel } = useSkillLevel();
  const { t, language } = useLanguage();
  const responsive = useResponsive();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modelNumber, setModelNumber] = useState<string>('');
  const [showModelInput, setShowModelInput] = useState(false); // PR #5: Only show if needed
  const [loading, setLoading] = useState(false);
  const [repairData, setRepairData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showSafetyGating, setShowSafetyGating] = useState(false);
  const [initialAnalysis, setInitialAnalysis] = useState<any>(null);

  // Responsive styles
  const responsiveStyles = {
    contentMaxWidth: responsive.isTablet ? responsive.contentMaxWidth : '100%',
    padding: responsive.isTablet ? 32 : 20,
    heroFontSize: responsive.isTablet ? 42 : 32,
    heroSubtitleSize: responsive.isTablet ? 18 : 15,
    buttonPadding: responsive.isTablet ? 20 : 16,
    imagePreviewHeight: responsive.isTablet ? 320 : 220,
    featureCardSize: responsive.isTablet ? 100 : 80,
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        // Show optional model input for manual entry
        setShowModelInput(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const analyzeImage = async (imageUri: string) => {
    console.log('🔍 Starting analysis for image:', imageUri);
    setLoading(true);
    
    try {
      let base64 = '';
      
      // Try FileSystem first, fallback to fetch
      try {
        console.log('📷 Reading image as base64 with FileSystem...');
        base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log('✅ Base64 encoded with FileSystem, length:', base64.length);
      } catch (fsError) {
        console.log('⚠️ FileSystem failed, trying fetch method...', fsError);
        // Fallback to fetch method for web
        const response = await fetch(imageUri);
        const blob = await response.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        console.log('✅ Base64 encoded with fetch, length:', base64.length);
      }

      console.log('🚀 Sending to API:', `${BACKEND_URL}/api/analyze-repair`);
      const response = await fetch(`${BACKEND_URL}/api/analyze-repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image_base64: base64,
          image_mime_type: 'image/jpeg',
          skill_level: skillLevel,
          model_number: modelNumber || undefined,
          language: language, // Pass current language for AI responses
        }),
      });

      console.log('📡 Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Analysis response received:', data);
        
        // Get clarifying questions (could be from clarifying_questions or diagnostic_questions)
        const questions = data.clarifying_questions?.length > 0 
          ? data.clarifying_questions 
          : data.diagnostic_questions || [];
        
        // ALWAYS show clarifying questions first to confirm the diagnosis
        if (questions.length > 0) {
          console.log('❓ Showing clarifying questions to confirm diagnosis');
          // Store the full analysis data - we'll use it after user confirms
          setInitialAnalysis({
            ...data,
            diagnostic_questions: questions // Use clarifying questions as diagnostic questions
          });
          setShowDiagnosticModal(true);
        } else {
          // No questions available (shouldn't happen normally) - go directly to results
          console.log('⚠️ No clarifying questions, showing repair guide directly');
          setRepairData(data);
          
          // Check if safety gating is needed
          const riskLevel = data.risk_level || 'low';
          const shouldGate = riskLevel === 'high' || riskLevel === 'critical' || data.stop_and_call_pro;
          
          if (shouldGate) {
            setShowSafetyGating(true);
          } else {
            setShowModal(true);
          }
        }
      } else {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        Alert.alert('Error', 'Failed to analyze image. Please try again.');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Error', 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/app-background.jpg')}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          theme.mode === 'dark' ? 'rgba(10, 10, 10, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          theme.mode === 'dark' ? 'rgba(26, 26, 46, 0.80)' : 'rgba(240, 244, 248, 0.80)',
        ]}
        style={styles.gradientOverlay}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <BlurView
            intensity={theme.colors.glassBlur}
            tint={theme.colors.glassTint}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.logoSection}>
                <Image 
                  source={require('../../assets/images/icon.png')} 
                  style={styles.logoImage}
                />
                <View>
                  <Text style={[styles.appName, { color: theme.colors.text }]}>FixIntel AI</Text>
                  <Text style={[styles.appTagline, { color: theme.colors.primary }]}>Intelligent Repair</Text>
                </View>
              </View>
            </View>
          </BlurView>

          {/* Main Content */}
          <ScrollView 
            style={styles.content}
            contentContainerStyle={[
              styles.scrollContent,
              { 
                padding: responsiveStyles.padding,
                alignItems: responsive.isTablet ? 'center' : 'stretch',
              }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* iPad-optimized content wrapper */}
            <View style={[
              styles.contentWrapper,
              { maxWidth: responsive.isTablet ? responsive.contentMaxWidth : '100%' }
            ]}>
              {/* Two-column layout for iPad landscape */}
              {responsive.isTablet && responsive.isLandscape ? (
                <View style={styles.tabletLandscapeContainer}>
                  {/* Left column - Hero + Image */}
                  <View style={styles.tabletLeftColumn}>
                    {/* Hero Section */}
                    <BlurView
                      intensity={theme.colors.glassBlur}
                      tint={theme.colors.glassTint}
                      style={[styles.heroCard, { borderColor: theme.colors.glassBorder }]}
                    >
                      <View style={styles.heroContent}>
                        <Text style={[styles.heroTitle, { color: theme.colors.text, fontSize: responsiveStyles.heroFontSize }]}>
                          {t('fixAnything')}{'\n'}{t('anywhere')}
                        </Text>
                        <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary, fontSize: responsiveStyles.heroSubtitleSize }]}>
                          {t('heroSubtitle')}
                        </Text>
                      </View>
                    </BlurView>

                    {/* Image Preview Card */}
                    {selectedImage ? (
                      <BlurView
                        intensity={theme.colors.glassBlur}
                        tint={theme.colors.glassTint}
                        style={[styles.imagePreviewCard, { borderColor: theme.colors.glassBorder, height: responsiveStyles.imagePreviewHeight }]}
                      >
                        <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                        {loading && (
                          <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={[styles.loadingText, { color: theme.colors.text }]}>{t('loading')}</Text>
                          </View>
                        )}
                      </BlurView>
                    ) : (
                      <BlurView
                        intensity={theme.colors.glassBlur}
                        tint={theme.colors.glassTint}
                        style={[styles.placeholderCard, { borderColor: theme.colors.glassBorder, height: responsiveStyles.imagePreviewHeight }]}
                      >
                        <LinearGradient
                          colors={theme.gradients.primary}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.placeholderIcon, { width: responsiveStyles.featureCardSize, height: responsiveStyles.featureCardSize, borderRadius: responsiveStyles.featureCardSize / 2 }]}
                        >
                          <Ionicons name="camera" size={responsive.isTablet ? 56 : 48} color="#fff" />
                        </LinearGradient>
                        <Text style={[styles.placeholderTitle, { color: theme.colors.text, fontSize: responsive.isTablet ? 22 : 18 }]}>{t('noImageSelected')}</Text>
                        <Text style={[styles.placeholderSubtitle, { color: theme.colors.textSecondary, fontSize: responsive.isTablet ? 16 : 14 }]}>
                          {t('snapPhotoSubtitle')}
                        </Text>
                      </BlurView>
                    )}
                  </View>

                  {/* Right column - Actions + Features */}
                  <View style={styles.tabletRightColumn}>
                    {/* Action Buttons */}
                    <View style={[styles.buttonContainer, { flexDirection: 'column' }]}>
                      {!selectedImage ? (
                        <>
                          <TouchableOpacity
                            style={[styles.buttonWrapper, { marginBottom: 12 }]}
                            onPress={() => pickImage(true)}
                            disabled={loading}
                          >
                            <LinearGradient
                              colors={theme.gradients.primary}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={[styles.primaryButton, { padding: responsiveStyles.buttonPadding }]}
                            >
                              <Ionicons name="camera" size={28} color="#fff" />
                              <Text style={[styles.primaryButtonText, { fontSize: responsive.isTablet ? 18 : 16 }]}>{t('takePhoto')}</Text>
                            </LinearGradient>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.buttonWrapper}
                            onPress={() => pickImage(false)}
                            disabled={loading}
                          >
                            <BlurView
                              intensity={theme.colors.glassBlur}
                              tint={theme.colors.glassTint}
                              style={[styles.secondaryButton, { borderColor: theme.colors.primary, padding: responsiveStyles.buttonPadding }]}
                            >
                              <Ionicons name="images" size={28} color={theme.colors.primary} />
                              <Text style={[styles.secondaryButtonText, { color: theme.colors.primary, fontSize: responsive.isTablet ? 18 : 16 }]}>{t('chooseGallery')}</Text>
                            </BlurView>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={[styles.buttonWrapper, { marginBottom: 12 }]}
                            onPress={() => {
                              if (selectedImage) {
                                analyzeImage(selectedImage);
                              }
                            }}
                            disabled={loading}
                          >
                            <LinearGradient
                              colors={theme.gradients.primary}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={[styles.primaryButton, { padding: responsiveStyles.buttonPadding }]}
                            >
                              <Ionicons name="flash" size={28} color="#fff" />
                              <Text style={[styles.primaryButtonText, { fontSize: responsive.isTablet ? 18 : 16 }]}>
                                {loading ? t('loading') : t('analyzeRepair')}
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.buttonWrapper}
                            onPress={() => setSelectedImage(null)}
                            disabled={loading}
                          >
                            <BlurView
                              intensity={theme.colors.glassBlur}
                              tint={theme.colors.glassTint}
                              style={[styles.secondaryButton, { borderColor: theme.colors.textSecondary, padding: responsiveStyles.buttonPadding }]}
                            >
                              <Ionicons name="refresh" size={24} color={theme.colors.textSecondary} />
                              <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>Select Different Image</Text>
                            </BlurView>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>

                    {/* Model Number Input */}
                    {selectedImage && (
                      <BlurView
                        intensity={theme.colors.glassBlur}
                        tint={theme.colors.glassTint}
                        style={[styles.modelInputCard, { borderColor: theme.colors.glassBorder }]}
                      >
                        <View style={styles.modelInputHeader}>
                          <Ionicons name="pricetag" size={20} color={theme.colors.primary} />
                          <Text style={[styles.modelInputTitle, { color: theme.colors.text }]}>
                            Model Number {modelNumber ? '✓' : '(Optional)'}
                          </Text>
                        </View>
                        <TextInput
                          style={[styles.modelInput, { 
                            color: theme.colors.text,
                            borderColor: modelNumber ? theme.colors.success : theme.colors.glassBorder,
                            backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          }]}
                          placeholder="e.g., XR-2000, ABC123"
                          placeholderTextColor={theme.colors.textTertiary}
                          value={modelNumber}
                          onChangeText={setModelNumber}
                          autoCapitalize="characters"
                          returnKeyType="done"
                        />
                      </BlurView>
                    )}

                    {/* Gamification Progress Card */}
                    <GamificationCard />

                    {/* Features Grid - 2x2 on tablet landscape */}
                    <View style={[styles.featuresGrid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                      {[
                        { icon: 'bulb', title: 'AI-Powered', color: theme.colors.primary },
                        { icon: 'construct', title: 'Step-by-Step', color: theme.colors.accent },
                        { icon: 'shield-checkmark', title: 'Safety Tips', color: theme.colors.success },
                        { icon: 'people', title: 'Community', color: theme.colors.warning },
                      ].map((feature, index) => (
                        <BlurView
                          key={index}
                          intensity={theme.colors.glassBlur}
                          tint={theme.colors.glassTint}
                          style={[styles.featureCard, { borderColor: theme.colors.glassBorder, width: '48%', marginBottom: 8 }]}
                        >
                          <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}20` }]}>
                            <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                          </View>
                          <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>{feature.title}</Text>
                        </BlurView>
                      ))}
                    </View>
                  </View>
                </View>
              ) : (
                /* Standard portrait/phone layout */
                <>
            {/* Hero Section */}
            <BlurView
              intensity={theme.colors.glassBlur}
              tint={theme.colors.glassTint}
              style={[styles.heroCard, { borderColor: theme.colors.glassBorder }]}
            >
              <View style={styles.heroContent}>
                <Text style={[styles.heroTitle, { color: theme.colors.text, fontSize: responsiveStyles.heroFontSize }]}>Fix Anything,{'\n'}Anywhere</Text>
                <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary, fontSize: responsiveStyles.heroSubtitleSize }]}>
                  Snap a photo of any broken item and get instant, expert repair guidance powered by advanced AI
                </Text>
              </View>
            </BlurView>

            {/* Image Preview Card */}
            {selectedImage ? (
              <BlurView
                intensity={theme.colors.glassBlur}
                tint={theme.colors.glassTint}
                style={[styles.imagePreviewCard, { borderColor: theme.colors.glassBorder, height: responsiveStyles.imagePreviewHeight }]}
              >
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                {loading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.text }]}>Analyzing with AI...</Text>
                  </View>
                )}
              </BlurView>
            ) : (
              <BlurView
                intensity={theme.colors.glassBlur}
                tint={theme.colors.glassTint}
                style={[styles.placeholderCard, { borderColor: theme.colors.glassBorder, height: responsiveStyles.imagePreviewHeight }]}
              >
                <LinearGradient
                  colors={theme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.placeholderIcon, { width: responsiveStyles.featureCardSize, height: responsiveStyles.featureCardSize, borderRadius: responsiveStyles.featureCardSize / 2 }]}
                >
                  <Ionicons name="camera" size={responsive.isTablet ? 56 : 48} color="#fff" />
                </LinearGradient>
                <Text style={[styles.placeholderTitle, { color: theme.colors.text, fontSize: responsive.isTablet ? 22 : 18 }]}>No Image Selected</Text>
                <Text style={[styles.placeholderSubtitle, { color: theme.colors.textSecondary, fontSize: responsive.isTablet ? 16 : 14 }]}>
                  Take a photo or choose from gallery to get started
                </Text>
              </BlurView>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {!selectedImage ? (
                <>
                  <TouchableOpacity
                    style={styles.buttonWrapper}
                    onPress={() => pickImage(true)}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={theme.gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.primaryButton}
                    >
                      <Ionicons name="camera" size={24} color="#fff" />
                      <Text style={styles.primaryButtonText}>Take Photo</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.buttonWrapper}
                    onPress={() => pickImage(false)}
                    disabled={loading}
                  >
                    <BlurView
                      intensity={theme.colors.glassBlur}
                      tint={theme.colors.glassTint}
                      style={[styles.secondaryButton, { borderColor: theme.colors.primary }]}
                    >
                      <Ionicons name="images" size={24} color={theme.colors.primary} />
                      <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>Gallery</Text>
                    </BlurView>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.buttonWrapper, { flex: 1 }]}
                    onPress={() => {
                      console.log('🎯 Analyze button clicked!');
                      Alert.alert('Repair Image Selected', `Ready to analyze your image`);
                      if (selectedImage) {
                        analyzeImage(selectedImage);
                      } else {
                        Alert.alert('Error', 'No image selected');
                      }
                    }}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={theme.gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.primaryButton}
                    >
                      <Ionicons name="flash" size={24} color="#fff" />
                      <Text style={styles.primaryButtonText}>
                        {loading ? 'Analyzing...' : 'Analyze & Get Repair Guide'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => setSelectedImage(null)}
                    disabled={loading}
                  >
                    <Ionicons name="refresh" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Model Number Input - Always visible when image selected */}
            {selectedImage && (
              <BlurView
                intensity={theme.colors.glassBlur}
                tint={theme.colors.glassTint}
                style={[styles.modelInputCard, { borderColor: theme.colors.glassBorder }]}
              >
                <View style={styles.modelInputHeader}>
                  <Ionicons name="pricetag" size={20} color={theme.colors.primary} />
                  <Text style={[styles.modelInputTitle, { color: theme.colors.text }]}>
                    Model Number {modelNumber ? '✓' : '(Optional)'}
                  </Text>
                </View>
                <Text style={[styles.modelInputSubtitle, { color: theme.colors.textSecondary }]}>
                  {modelNumber ? 'Model number saved' : 'Enter for more accurate repair guidance'}
                </Text>
                <TextInput
                  style={[styles.modelInput, { 
                    color: theme.colors.text,
                    borderColor: modelNumber ? theme.colors.success : theme.colors.glassBorder,
                    backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  }]}
                  placeholder="e.g., XR-2000, ABC123"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={modelNumber}
                  onChangeText={setModelNumber}
                  autoCapitalize="characters"
                  returnKeyType="done"
                />
              </BlurView>
            )}

            {/* Gamification Progress Card */}
            <GamificationCard />

            {/* Features Grid */}
            <View style={[styles.featuresGrid, responsive.isTablet && styles.tabletFeaturesGrid]}>
              {[
                { icon: 'bulb', title: 'AI-Powered', color: theme.colors.primary },
                { icon: 'construct', title: 'Step-by-Step', color: theme.colors.accent },
                { icon: 'shield-checkmark', title: 'Safety Tips', color: theme.colors.success },
                { icon: 'people', title: 'Community', color: theme.colors.warning },
              ].map((feature, index) => (
                <BlurView
                  key={index}
                  intensity={theme.colors.glassBlur}
                  tint={theme.colors.glassTint}
                  style={[
                    styles.featureCard, 
                    { borderColor: theme.colors.glassBorder },
                    responsive.isTablet && { minWidth: responsive.cardWidth }
                  ]}
                >
                  <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}20` }]}>
                    <Ionicons name={feature.icon as any} size={responsive.isTablet ? 28 : 24} color={feature.color} />
                  </View>
                  <Text style={[styles.featureText, { color: theme.colors.textSecondary, fontSize: responsive.isTablet ? 15 : 13 }]}>{feature.title}</Text>
                </BlurView>
              ))}
            </View>
                </>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Diagnostic Questions Modal */}
      {initialAnalysis && (
        <DiagnosticQuestionsModal
          visible={showDiagnosticModal}
          itemType={initialAnalysis.item_type || 'device'}
          initialAnalysis={initialAnalysis}
          onDiagnosisComplete={(refinedData) => {
            const finalData = refinedData.refined_diagnosis || initialAnalysis;
            setRepairData(finalData);
            setShowDiagnosticModal(false);
            
            // Check if safety gating is needed
            const riskLevel = finalData.risk_level || 'low';
            const shouldGate = riskLevel === 'high' || riskLevel === 'critical' || finalData.stop_and_call_pro;
            
            if (shouldGate) {
              setShowSafetyGating(true);
            } else {
              setShowModal(true);
            }
          }}
          onClose={() => {
            setShowDiagnosticModal(false);
            setSelectedImage(null);
            setInitialAnalysis(null);
          }}
        />
      )}

      {/* Safety Gating Modal */}
      {repairData && showSafetyGating && (
        <SafetyGatingModal
          visible={showSafetyGating}
          riskLevel={(repairData.risk_level || 'medium') as RiskLevel}
          itemType={repairData.item_type || 'item'}
          confidenceScore={repairData.confidence_score || 85}
          stopAndCallPro={repairData.stop_and_call_pro || false}
          assumptions={repairData.assumptions || []}
          onAcknowledge={() => {
            setShowSafetyGating(false);
            setShowModal(true);
          }}
          onCallPro={() => {
            setShowSafetyGating(false);
            // Open local vendors modal
            Alert.alert('Find a Professional', 'This will open the local professionals finder.');
          }}
          onCancel={() => {
            setShowSafetyGating(false);
            setSelectedImage(null);
            setRepairData(null);
          }}
        />
      )}

      {/* Repair Instructions Modal */}
      {repairData && (
        <RepairInstructionsModal
          visible={showModal}
          repairData={repairData}
          onClose={() => {
            setShowModal(false);
            setSelectedImage(null);
            setRepairData(null);
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
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  headerContent: {
    padding: 16,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroContent: {
    gap: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  imagePreviewCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    height: 220,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    height: 220,
    gap: 12,
    overflow: 'hidden',
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholderSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  retakeButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // PR #5: Model Number Input Styles
  modelInputCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modelInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modelInputTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modelInputSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  modelInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  // iPad/Tablet Responsive Styles
  contentWrapper: {
    width: '100%',
  },
  tabletLandscapeContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  tabletLeftColumn: {
    flex: 1,
    gap: 20,
  },
  tabletRightColumn: {
    flex: 1,
    gap: 20,
  },
  tabletFeaturesGrid: {
    gap: 16,
  },
});