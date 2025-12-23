/**
 * Fix Stuff - Professional Logo Component
 * Company: RentMouse
 * Modern SVG-based logo with gradient and geometric design
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Polygon } from 'react-native-svg';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';

interface AppLogoProps {
  size?: number;
  showText?: boolean;
  variant?: 'full' | 'icon' | 'horizontal';
}

export default function AppLogo({ size = 120, showText = true, variant = 'full' }: AppLogoProps) {
  const iconSize = variant === 'horizontal' ? size * 0.4 : size;
  const textSize = size * 0.2;

  return (
    <View style={[styles.container, variant === 'horizontal' && styles.horizontal]}>
      {/* Logo Icon - Wrench + AI Brain Circuit */}
      <View style={[styles.iconContainer, { width: iconSize, height: iconSize }]}>
        <Svg width={iconSize} height={iconSize} viewBox="0 0 200 200">
          <Defs>
            <LinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#00D9FF" stopOpacity="1" />
              <Stop offset="50%" stopColor="#00A8CC" stopOpacity="1" />
              <Stop offset="100%" stopColor="#0080FF" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#00FFAA" stopOpacity="1" />
              <Stop offset="100%" stopColor="#00D9FF" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Outer Hexagon Ring */}
          <Polygon
            points="100,20 170,60 170,140 100,180 30,140 30,60"
            fill="none"
            stroke="url(#logoGradient)"
            strokeWidth="4"
            opacity="0.3"
          />

          {/* Inner Hexagon */}
          <Polygon
            points="100,40 150,70 150,130 100,160 50,130 50,70"
            fill="none"
            stroke="url(#logoGradient)"
            strokeWidth="3"
            opacity="0.5"
          />

          {/* Wrench Tool (Main Symbol) */}
          <Path
            d="M 85 65 L 115 95 L 130 80 L 125 75 Q 130 65 125 55 Q 115 50 105 55 L 100 60 L 85 45 Q 75 40 65 50 Q 60 60 65 70 L 85 65 Z"
            fill="url(#logoGradient)"
            opacity="0.9"
          />

          {/* AI Circuit Nodes */}
          <Circle cx="70" cy="85" r="4" fill="url(#accentGradient)" />
          <Circle cx="130" cy="85" r="4" fill="url(#accentGradient)" />
          <Circle cx="100" cy="115" r="4" fill="url(#accentGradient)" />
          <Circle cx="70" cy="115" r="3" fill="#00D9FF" opacity="0.6" />
          <Circle cx="130" cy="115" r="3" fill="#00D9FF" opacity="0.6" />

          {/* Circuit Lines */}
          <Path
            d="M 70 85 L 100 100 L 130 85 M 70 115 L 100 115 L 130 115"
            stroke="url(#accentGradient)"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />

          {/* AI Sparkle Effect */}
          <Path
            d="M 145 55 L 147 58 L 150 56 L 148 53 Z"
            fill="#00FFAA"
          />
          <Path
            d="M 155 70 L 156 72 L 158 71 L 157 69 Z"
            fill="#00D9FF"
          />
          <Path
            d="M 50 145 L 52 148 L 55 146 L 53 143 Z"
            fill="#00FFAA"
          />

          {/* Center Glow Circle */}
          <Circle
            cx="100"
            cy="100"
            r="25"
            fill="url(#logoGradient)"
            opacity="0.1"
          />
        </Svg>

        {/* Glow Effect Background */}
        <View style={[styles.glowEffect, { width: iconSize, height: iconSize }]} />
      </View>

      {/* Text Branding */}
      {showText && (
        <View style={styles.textContainer}>
          {variant !== 'horizontal' && (
            <Text style={[styles.brandName, { fontSize: textSize }]}>
              <Text style={styles.fix}>Fix</Text>
              <Text style={styles.intel}>Intel</Text>
              <Text style={styles.ai}> AI</Text>
            </Text>
          )}
          {variant === 'horizontal' && (
            <View style={styles.horizontalText}>
              <Text style={[styles.brandNameHorizontal, { fontSize: textSize * 1.2 }]}>
                <Text style={styles.fix}>Fix</Text>
                <Text style={styles.intel}>Intel</Text>
                <Text style={styles.ai}> AI</Text>
              </Text>
              <Text style={[styles.tagline, { fontSize: textSize * 0.5 }]}>
                AI-Powered Repair Intelligence
              </Text>
            </View>
          )}
          {variant === 'full' && (
            <Text style={[styles.tagline, { fontSize: textSize * 0.5 }]}>
              AI-Powered Repair Intelligence
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontal: {
    flexDirection: 'row',
    gap: 16,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: '#00D9FF',
    opacity: 0.1,
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  horizontalText: {
    justifyContent: 'center',
  },
  brandName: {
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  brandNameHorizontal: {
    fontWeight: '900',
    letterSpacing: 1,
  },
  fix: {
    color: '#fff',
  },
  intel: {
    color: '#00D9FF',
  },
  ai: {
    color: '#00FFAA',
    fontWeight: '900',
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
});
