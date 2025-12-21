import { useState, useEffect } from 'react';
import { Dimensions, Platform, ScaledSize } from 'react-native';

export type DeviceType = 'phone' | 'tablet';

interface ResponsiveInfo {
  width: number;
  height: number;
  isTablet: boolean;
  isPhone: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  deviceType: DeviceType;
  // Responsive spacing multiplier
  spacing: number;
  // Responsive font scale
  fontScale: number;
  // Number of columns for grids
  gridColumns: number;
  // Content max width for tablets
  contentMaxWidth: number;
  // Card width for grid layouts
  cardWidth: number;
}

const TABLET_MIN_WIDTH = 768;
const TABLET_CONTENT_MAX_WIDTH = 800;
const TABLET_WIDE_CONTENT_MAX_WIDTH = 1100;

function getResponsiveInfo(window: ScaledSize): ResponsiveInfo {
  const { width, height } = window;
  const isLandscape = width > height;
  
  // Determine if tablet based on minimum dimension (for rotation support)
  const minDimension = Math.min(width, height);
  const isTablet = minDimension >= TABLET_MIN_WIDTH || 
    (Platform.OS === 'ios' && Platform.isPad) ||
    (Platform.OS === 'web' && width >= TABLET_MIN_WIDTH);
  
  const isPhone = !isTablet;
  const deviceType: DeviceType = isTablet ? 'tablet' : 'phone';
  
  // Responsive multipliers
  const spacing = isTablet ? 1.5 : 1;
  const fontScale = isTablet ? 1.15 : 1;
  
  // Grid columns: tablets get more columns, especially in landscape
  let gridColumns = 2;
  if (isTablet) {
    gridColumns = isLandscape ? 4 : 3;
  }
  
  // Content max width - center content on larger screens
  const contentMaxWidth = isTablet 
    ? (isLandscape ? TABLET_WIDE_CONTENT_MAX_WIDTH : TABLET_CONTENT_MAX_WIDTH)
    : width;
  
  // Calculate card width based on columns and available space
  const cardPadding = isTablet ? 24 : 16;
  const cardGap = isTablet ? 16 : 12;
  const availableWidth = Math.min(width - (cardPadding * 2), contentMaxWidth - (cardPadding * 2));
  const cardWidth = (availableWidth - (cardGap * (gridColumns - 1))) / gridColumns;
  
  return {
    width,
    height,
    isTablet,
    isPhone,
    isLandscape,
    isPortrait: !isLandscape,
    deviceType,
    spacing,
    fontScale,
    gridColumns,
    contentMaxWidth,
    cardWidth,
  };
}

export function useResponsive(): ResponsiveInfo {
  const [dimensions, setDimensions] = useState(() => 
    getResponsiveInfo(Dimensions.get('window'))
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(getResponsiveInfo(window));
    });

    return () => subscription.remove();
  }, []);

  return dimensions;
}

// Utility function for responsive values
export function responsiveValue<T>(
  isTablet: boolean,
  phoneValue: T,
  tabletValue: T
): T {
  return isTablet ? tabletValue : phoneValue;
}

// Utility for responsive font sizes
export function responsiveFontSize(
  baseSize: number,
  fontScale: number
): number {
  return Math.round(baseSize * fontScale);
}

// Utility for responsive spacing
export function responsiveSpacing(
  baseSpacing: number,
  spacingMultiplier: number
): number {
  return Math.round(baseSpacing * spacingMultiplier);
}

export default useResponsive;
