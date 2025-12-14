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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import RepairInstructionsModal from '../components/RepairInstructionsModal';
import DiagnosticQuestionsModal from '../components/DiagnosticQuestionsModal';
import SafetyGatingModal from '../components/SafetyGatingModal';
import { useTheme } from '../contexts/ThemeContext';
import { useSkillLevel } from '../contexts/SkillLevelContext';
import { RiskLevel } from '../types/models';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HomeScreen() {
  const { theme } = useTheme();
  const { skillLevel } = useSkillLevel();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [repairData, setRepairData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showSafetyGating, setShowSafetyGating] = useState(false);
  const [initialAnalysis, setInitialAnalysis] = useState<any>(null);

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
        // Don't auto-analyze - let user click the analyze button
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const analyzeImage = async (imageUri: string) => {
    setLoading(true);
    try {
      const base64 = await fetch(imageUri)
        .then((res) => res.blob())
        .then(
          (blob) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64String = reader.result as string;
                resolve(base64String.split(',')[1]);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            })
        );

      const response = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: base64,
          skill_level: skillLevel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInitialAnalysis(data);
        // Show diagnostic questions first
        setShowDiagnosticModal(true);
      } else {
        Alert.alert('Error', 'Failed to analyze image');
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
      source={{
        uri: theme.mode === 'dark'
          ? 'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1080'
          : 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?crop=entropy&cs=srgb&fm=jpg&q=85&w=1080',
      }}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          theme.mode === 'dark' ? 'rgba(10, 10, 10, 0.75)' : 'rgba(255, 255, 255, 0.80)',
          theme.mode === 'dark' ? 'rgba(26, 26, 46, 0.70)' : 'rgba(240, 244, 248, 0.75)',
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
                <LinearGradient
                  colors={theme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoGradient}
                >
                  <Text style={styles.logoIcon}>🔧</Text>
                </LinearGradient>
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
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Section */}
            <BlurView
              intensity={theme.colors.glassBlur}
              tint={theme.colors.glassTint}
              style={[styles.heroCard, { borderColor: theme.colors.glassBorder }]}
            >
              <View style={styles.heroContent}>
                <Text style={[styles.heroTitle, { color: theme.colors.text }]}>Fix Anything,{' \n'}Anywhere</Text>
                <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
                  Snap a photo of any broken item and get instant, expert repair guidance powered by advanced AI
                </Text>
              </View>
            </BlurView>

            {/* Image Preview Card */}
            {selectedImage ? (
              <BlurView
                intensity={theme.colors.glassBlur}
                tint={theme.colors.glassTint}
                style={[styles.imagePreviewCard, { borderColor: theme.colors.glassBorder }]}
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
                style={[styles.placeholderCard, { borderColor: theme.colors.glassBorder }]}
              >
                <LinearGradient
                  colors={theme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.placeholderIcon}
                >
                  <Ionicons name="camera" size={48} color="#fff" />
                </LinearGradient>
                <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>No Image Selected</Text>
                <Text style={[styles.placeholderSubtitle, { color: theme.colors.textSecondary }]}>
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
                    onPress={() => analyzeImage(selectedImage)}
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

            {/* Features Grid */}
            <View style={styles.featuresGrid}>
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
                  style={[styles.featureCard, { borderColor: theme.colors.glassBorder }]}
                >
                  <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}20` }]}>
                    <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                  </View>
                  <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>{feature.title}</Text>
                </BlurView>
              ))}
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
  logoGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 24,
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
});