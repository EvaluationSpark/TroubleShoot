/**
 * FixIntel AI - Skill Level Context
 * Company: RentMouse
 * Manages user skill level across the app
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { SkillLevel } from '../types/models';
import { getUserPreferences, setUserPreferences } from '../utils/storage';

interface SkillLevelContextType {
  skillLevel: SkillLevel;
  setSkillLevel: (level: SkillLevel) => Promise<void>;
  skillLevelLabel: string;
  skillLevelDescription: string;
}

const SkillLevelContext = createContext<SkillLevelContextType | undefined>(undefined);

export const SkillLevelProvider = ({ children }: { children: ReactNode }) => {
  const [skillLevel, setSkillLevelState] = useState<SkillLevel>(SkillLevel.DIY);

  useEffect(() => {
    loadSkillLevel();
  }, []);

  const loadSkillLevel = async () => {
    try {
      const prefs = await getUserPreferences();
      setSkillLevelState(prefs.skillLevel);
    } catch (error) {
      console.error('Error loading skill level:', error);
    }
  };

  const setSkillLevel = async (level: SkillLevel) => {
    try {
      await setUserPreferences({ skillLevel: level });
      setSkillLevelState(level);
      console.log('Skill level updated to:', level);
    } catch (error) {
      console.error('Error setting skill level:', error);
      throw error;
    }
  };

  const getSkillLevelLabel = (): string => {
    switch (skillLevel) {
      case SkillLevel.Beginner:
        return 'Beginner';
      case SkillLevel.DIY:
        return 'DIY Enthusiast';
      case SkillLevel.Pro:
        return 'Professional';
      default:
        return 'DIY Enthusiast';
    }
  };

  const getSkillLevelDescription = (): string => {
    switch (skillLevel) {
      case SkillLevel.Beginner:
        return 'New to repairs, need detailed step-by-step guidance';
      case SkillLevel.DIY:
        return 'Comfortable with basic tools and repairs';
      case SkillLevel.Pro:
        return 'Experienced technician with advanced skills';
      default:
        return 'Comfortable with basic tools and repairs';
    }
  };

  return (
    <SkillLevelContext.Provider
      value={{
        skillLevel,
        setSkillLevel,
        skillLevelLabel: getSkillLevelLabel(),
        skillLevelDescription: getSkillLevelDescription(),
      }}
    >
      {children}
    </SkillLevelContext.Provider>
  );
};

export const useSkillLevel = () => {
  const context = useContext(SkillLevelContext);
  if (context === undefined) {
    throw new Error('useSkillLevel must be used within a SkillLevelProvider');
  }
  return context;
};

// Utility functions for skill level specific content
export const getInstructionDetailLevel = (skillLevel: SkillLevel): 'detailed' | 'standard' | 'concise' => {
  switch (skillLevel) {
    case SkillLevel.Beginner:
      return 'detailed';
    case SkillLevel.DIY:
      return 'standard';
    case SkillLevel.Pro:
      return 'concise';
    default:
      return 'standard';
  }
};

export const getToolAssumptions = (skillLevel: SkillLevel): string => {
  switch (skillLevel) {
    case SkillLevel.Beginner:
      return 'Assume basic household tools only. Suggest alternatives for specialized tools.';
    case SkillLevel.DIY:
      return 'Assume standard DIY toolkit available. Mention specialized tools when needed.';
    case SkillLevel.Pro:
      return 'Assume professional toolkit available. Use technical terminology freely.';
    default:
      return 'Assume standard DIY toolkit available.';
  }
};

export const getWarningLevel = (skillLevel: SkillLevel): 'high' | 'medium' | 'low' => {
  switch (skillLevel) {
    case SkillLevel.Beginner:
      return 'high'; // More warnings, more caution
    case SkillLevel.DIY:
      return 'medium'; // Balanced warnings
    case SkillLevel.Pro:
      return 'low'; // Assume they know the risks
    default:
      return 'medium';
  }
};
