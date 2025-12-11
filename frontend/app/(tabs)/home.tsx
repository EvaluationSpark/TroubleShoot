import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RepairInstructionsModal from '../components/RepairInstructionsModal';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HomeScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [repairData, setRepairData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return false;
      }
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permission is required to select photos.');
        return false;
      }
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setSelectedImage(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setSelectedImage(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select or take a photo first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/analyze-repair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: selectedImage,
          language: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      setRepairData(data);
      setShowModal(true);
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Error', 'Failed to analyze the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section with Gradient */}
        <LinearGradient
          colors={['#001a1a', '#003333', '#00524d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#00D9FF', '#00a8cc']}
                style={styles.logoGradient}
              >
                <Ionicons name="construct" size={40} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Pix-Fix</Text>
            <Text style={styles.subtitle}>AI-Powered Repair Assistant</Text>
            <Text style={styles.description}>
              Snap a photo of any broken item and get instant, expert repair guidance powered by advanced AI
            </Text>
          </View>
        </LinearGradient>

        {/* Image Preview */}
        {selectedImage ? (
          <View style={styles.imageSection}>
            <View style={styles.imageCard}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.imageOverlay}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setSelectedImage(null)}
              >
                <LinearGradient
                  colors={['#ff4444', '#cc0000']}
                  style={styles.removeButtonGradient}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderSection}>
            <View style={styles.placeholderCard}>
              <LinearGradient
                colors={['#1a2a2a', '#0f1f1f']}
                style={styles.placeholderGradient}
              >
                <View style={styles.placeholderIcon}>
                  <Ionicons name="camera-outline" size={64} color="#00D9FF" />
                </View>
                <Text style={styles.placeholderTitle}>No Image Selected</Text>
                <Text style={styles.placeholderText}>Take a photo or choose from gallery to get started</Text>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={takePhoto}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2a2a2a', '#1a1a1a']}
              style={styles.actionButtonGradient}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="camera" size={28} color="#00D9FF" />
              </View>
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={pickImage}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2a2a2a', '#1a1a1a']}
              style={styles.actionButtonGradient}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="images" size={28} color="#00D9FF" />
              </View>
              <Text style={styles.actionButtonText}>Gallery</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Analyze Button */}
        {selectedImage && (
          <TouchableOpacity
            style={[styles.analyzeButton, loading && styles.disabledButton]}
            onPress={analyzeImage}
            disabled={loading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#00D9FF', '#00a8cc', '#008299']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.analyzeButtonGradient}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={24} color="#fff" />
                  <Text style={styles.analyzeButtonText}>Analyze & Get Repair Guide</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>What You'll Get</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#1a2a2a', '#0f1f1f']}
                style={styles.featureCardGradient}
              >
                <View style={styles.featureIconContainer}>
                  <Ionicons name="list" size={28} color="#00D9FF" />
                </View>
                <Text style={styles.featureTitle}>Step-by-Step</Text>
                <Text style={styles.featureDescription}>Detailed repair instructions</Text>
              </LinearGradient>
            </View>

            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#1a2a2a', '#0f1f1f']}
                style={styles.featureCardGradient}
              >
                <View style={styles.featureIconContainer}>
                  <Ionicons name="build" size={28} color="#4ade80" />
                </View>
                <Text style={styles.featureTitle}>Tools & Parts</Text>
                <Text style={styles.featureDescription}>Everything you need</Text>
              </LinearGradient>
            </View>

            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#1a2a2a', '#0f1f1f']}
                style={styles.featureCardGradient}
              >
                <View style={styles.featureIconContainer}>
                  <Ionicons name="shield-checkmark" size={28} color="#fbbf24" />
                </View>
                <Text style={styles.featureTitle}>Safety Tips</Text>
                <Text style={styles.featureDescription}>Stay protected</Text>
              </LinearGradient>
            </View>

            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#1a2a2a', '#0f1f1f']}
                style={styles.featureCardGradient}
              >
                <View style={styles.featureIconContainer}>
                  <Ionicons name="location" size={28} color="#f87171" />
                </View>
                <Text style={styles.featureTitle}>Local Shops</Text>
                <Text style={styles.featureDescription}>Find experts nearby</Text>
              </LinearGradient>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Repair Instructions Modal */}
      {repairData && (
        <RepairInstructionsModal
          visible={showModal}
          repairData={repairData}
          onClose={() => setShowModal(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  heroContent: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D9FF',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  imageSection: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  imageCard: {
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  removeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  removeButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  placeholderSection: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  placeholderCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1a2a2a',
    borderStyle: 'dashed',
  },
  placeholderGradient: {
    padding: 48,
    alignItems: 'center',
  },
  placeholderIcon: {
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonGradient: {
    padding: 20,
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  analyzeButton: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  analyzeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureCard: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  featureCardGradient: {
    padding: 20,
    minHeight: 140,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
});
