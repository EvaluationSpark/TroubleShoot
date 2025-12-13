import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Rotate animation for logo
    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Auto-hide after 3 seconds
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 3000);
  }, []);

  const rotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={styles.container}>
      {/* Background Image with Gradient Overlay */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHw0fHxBSSUyMHRlY2hub2xvZ3l8ZW58MHx8fGJsdWV8MTc2NTYwNDUwM3ww&ixlib=rb-4.1.0&q=85' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark Gradient Overlay */}
        <LinearGradient
          colors={['rgba(10, 10, 10, 0.95)', 'rgba(0, 20, 40, 0.9)', 'rgba(0, 60, 100, 0.85)']}
          style={styles.gradientOverlay}
        >
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Glass Card */}
            <BlurView intensity={15} tint="dark" style={styles.glassCard}>
              {/* Animated Glow Effect */}
              <Animated.View style={[styles.glowCircle, { opacity: glowOpacity }]}>
                <LinearGradient
                  colors={['#00D9FF', '#9D4EDD', '#00D9FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.glowGradient}
                />
              </Animated.View>

              {/* Logo Container */}
              <View style={styles.logoContainer}>
                <Animated.View
                  style={[
                    styles.logoCircle,
                    {
                      transform: [{ rotate: rotation }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#00D9FF', '#0099CC', '#006699']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.logoGradient}
                  >
                    <Text style={styles.logoIcon}>🔧</Text>
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* App Name */}
              <View style={styles.textContainer}>
                <Text style={styles.appName}>FixIntel AI</Text>
                <View style={styles.taglineContainer}>
                  <View style={styles.sparkle}>
                    <Text style={styles.sparkleText}>✨</Text>
                  </View>
                  <Text style={styles.tagline}>Intelligent Repair Assistant</Text>
                </View>
              </View>

              {/* Loading Indicator */}
              <View style={styles.loadingContainer}>
                <View style={styles.loadingBar}>
                  <Animated.View
                    style={[
                      styles.loadingProgress,
                      {
                        width: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['#00D9FF', '#9D4EDD']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.loadingGradient}
                    />
                  </Animated.View>
                </View>
                <Text style={styles.loadingText}>Initializing AI Engine...</Text>
              </View>
            </BlurView>

            {/* Floating Particles Effect */}
            <View style={styles.particlesContainer}>
              {[...Array(6)].map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.particle,
                    {
                      left: `${(i + 1) * 15}%`,
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [100, -20 - i * 10],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
          </Animated.View>

          {/* Version Text */}
          <Animated.View style={[styles.versionContainer, { opacity: fadeAnim }]}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <Text style={styles.poweredBy}>Powered by Advanced AI</Text>
          </Animated.View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCard: {
    width: width * 0.85,
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  glowCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: '50%',
    left: '50%',
    marginLeft: -150,
    marginTop: -150,
    overflow: 'hidden',
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 15,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 56,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    textShadowColor: '#00D9FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 12,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sparkle: {
    opacity: 0.8,
  },
  sparkleText: {
    fontSize: 16,
  },
  tagline: {
    fontSize: 16,
    color: '#00D9FF',
    fontWeight: '600',
    letterSpacing: 1,
  },
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
  },
  loadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  loadingProgress: {
    height: '100%',
  },
  loadingGradient: {
    flex: 1,
  },
  loadingText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00D9FF',
    opacity: 0.6,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
    marginBottom: 4,
  },
  poweredBy: {
    fontSize: 11,
    color: 'rgba(0, 217, 255, 0.7)',
    fontWeight: '500',
  },
});
