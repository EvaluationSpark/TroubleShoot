/**
 * FixIntel AI - Storage & Migration System
 * Company: RentMouse
 * Handles AsyncStorage with versioning and safe migrations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageSchema, RepairProgress, UserPreferences, SkillLevel } from '../types/models';

// ============ CONSTANTS ============

export const STORAGE_KEYS = {
  SCHEMA_VERSION: '@fixintel_schema_version',
  REPAIRS: '@pix_fix_repairs', // Keep old key for backward compatibility
  USER_PREFERENCES: '@fixintel_user_preferences',
  THEME_MODE: '@fixintel_theme_mode',
  REPAIR_HISTORY: '@fixintel_repair_history',
  REMINDERS: '@fixintel_reminders',
  DRAFT_REPAIRS: '@fixintel_draft_repairs',
} as const;

export const CURRENT_SCHEMA_VERSION = 2;

// ============ MIGRATION SYSTEM ============

/**
 * Initialize storage and run migrations
 */
export async function initializeStorage(): Promise<void> {
  try {
    const schemaData = await getStorageSchema();
    
    if (!schemaData) {
      // First time initialization
      await createInitialSchema();
      console.log('✅ Storage initialized with version', CURRENT_SCHEMA_VERSION);
      return;
    }

    // Run migrations if needed
    if (schemaData.version < CURRENT_SCHEMA_VERSION) {
      console.log(`🔄 Migrating storage from v${schemaData.version} to v${CURRENT_SCHEMA_VERSION}`);
      await runMigrations(schemaData.version);
    } else {
      console.log(`✅ Storage up to date (v${schemaData.version})`);
    }
  } catch (error) {
    console.error('❌ Storage initialization error:', error);
    // Don't throw - allow app to continue with defaults
  }
}

/**
 * Get current storage schema
 */
async function getStorageSchema(): Promise<StorageSchema | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading storage schema:', error);
    return null;
  }
}

/**
 * Create initial schema
 */
async function createInitialSchema(): Promise<void> {
  const schema: StorageSchema = {
    version: CURRENT_SCHEMA_VERSION,
    lastUpdated: new Date(),
    migrations: [
      {
        version: CURRENT_SCHEMA_VERSION,
        appliedAt: new Date(),
      },
    ],
  };

  await AsyncStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, JSON.stringify(schema));
  
  // Initialize user preferences with defaults
  await setUserPreferences(getDefaultUserPreferences());
}

/**
 * Run all necessary migrations
 */
async function runMigrations(fromVersion: number): Promise<void> {
  const migrations = [
    { version: 1, migrate: migrateToV1 },
    { version: 2, migrate: migrateToV2 },
  ];

  for (const migration of migrations) {
    if (fromVersion < migration.version) {
      console.log(`  Applying migration to v${migration.version}...`);
      try {
        await migration.migrate();
        await updateSchemaVersion(migration.version);
        console.log(`  ✅ Migration to v${migration.version} complete`);
      } catch (error) {
        console.error(`  ❌ Migration to v${migration.version} failed:`, error);
        throw error;
      }
    }
  }
}

/**
 * Update schema version
 */
async function updateSchemaVersion(version: number): Promise<void> {
  const schema = await getStorageSchema();
  if (!schema) {
    await createInitialSchema();
    return;
  }

  schema.version = version;
  schema.lastUpdated = new Date();
  schema.migrations.push({
    version,
    appliedAt: new Date(),
  });

  await AsyncStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, JSON.stringify(schema));
}

// ============ MIGRATION FUNCTIONS ============

/**
 * Migration to V1: Initial versioned schema
 */
async function migrateToV1(): Promise<void> {
  // V1 just adds versioning, no data changes needed
  console.log('  No data migration needed for V1');
}

/**
 * Migration to V2: Add skill level and enhanced fields
 */
async function migrateToV2(): Promise<void> {
  try {
    // Migrate existing repairs to add new fields
    const repairsData = await AsyncStorage.getItem(STORAGE_KEYS.REPAIRS);
    if (repairsData) {
      const repairs: RepairProgress[] = JSON.parse(repairsData);
      const migratedRepairs = repairs.map((repair) => ({
        ...repair,
        skillLevel: repair.skillLevel || SkillLevel.DIY,
        estimatedSavings: repair.estimatedSavings || 0,
        photosProgress: repair.photosProgress || [],
      }));
      await AsyncStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify(migratedRepairs));
      console.log(`  Migrated ${repairs.length} repairs`);
    }

    // Initialize user preferences if they don't exist
    const prefsData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (!prefsData) {
      await setUserPreferences(getDefaultUserPreferences());
      console.log('  Initialized user preferences');
    }
  } catch (error) {
    console.error('  Error in V2 migration:', error);
    throw error;
  }
}

// ============ USER PREFERENCES ============

/**
 * Get default user preferences
 */
function getDefaultUserPreferences(): UserPreferences {
  return {
    skillLevel: SkillLevel.DIY,
    theme: 'dark',
    notificationsEnabled: false,
    language: 'en',
    remindersEnabled: false,
    defaultReminderHours: 24,
  };
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (!data) {
      return getDefaultUserPreferences();
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return getDefaultUserPreferences();
  }
}

/**
 * Set user preferences
 */
export async function setUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  try {
    const current = await getUserPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
  } catch (error) {
    console.error('Error setting user preferences:', error);
    throw error;
  }
}

/**
 * Update skill level
 */
export async function setSkillLevel(skillLevel: SkillLevel): Promise<void> {
  await setUserPreferences({ skillLevel });
}

/**
 * Get skill level
 */
export async function getSkillLevel(): Promise<SkillLevel> {
  const prefs = await getUserPreferences();
  return prefs.skillLevel;
}

// ============ REPAIR STORAGE ============

/**
 * Get all repairs
 */
export async function getRepairs(): Promise<RepairProgress[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REPAIRS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting repairs:', error);
    return [];
  }
}

/**
 * Save a repair
 */
export async function saveRepair(repair: RepairProgress): Promise<void> {
  try {
    const repairs = await getRepairs();
    const existingIndex = repairs.findIndex((r) => r.id === repair.id);
    
    if (existingIndex >= 0) {
      repairs[existingIndex] = repair;
    } else {
      repairs.unshift(repair);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify(repairs));
  } catch (error) {
    console.error('Error saving repair:', error);
    throw error;
  }
}

/**
 * Delete a repair
 */
export async function deleteRepair(repairId: string): Promise<void> {
  try {
    const repairs = await getRepairs();
    const filtered = repairs.filter((r) => r.id !== repairId);
    await AsyncStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting repair:', error);
    throw error;
  }
}

/**
 * Update repair progress
 */
export async function updateRepairProgress(
  repairId: string,
  progressPercentage: number,
  stepsCompleted: number
): Promise<void> {
  try {
    const repairs = await getRepairs();
    const repair = repairs.find((r) => r.id === repairId);
    
    if (repair) {
      repair.progressPercentage = progressPercentage;
      repair.stepsCompleted = stepsCompleted;
      repair.lastUpdated = new Date();
      
      if (progressPercentage >= 100) {
        repair.completedAt = new Date();
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify(repairs));
    }
  } catch (error) {
    console.error('Error updating repair progress:', error);
    throw error;
  }
}

// ============ UTILITY FUNCTIONS ============

/**
 * Clear all storage (for debugging/testing)
 */
export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.clear();
    console.log('✅ All storage cleared');
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
}

/**
 * Export storage data (for backup/debugging)
 */
export async function exportStorageData(): Promise<Record<string, any>> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);
    
    const data: Record<string, any> = {};
    items.forEach(([key, value]) => {
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    });
    
    return data;
  } catch (error) {
    console.error('Error exporting storage:', error);
    return {};
  }
}

/**
 * Get storage info (for debugging)
 */
export async function getStorageInfo(): Promise<{
  version: number;
  repairsCount: number;
  totalSize: number;
}> {
  try {
    const schema = await getStorageSchema();
    const repairs = await getRepairs();
    const data = await exportStorageData();
    const totalSize = JSON.stringify(data).length;
    
    return {
      version: schema?.version || 0,
      repairsCount: repairs.length,
      totalSize,
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { version: 0, repairsCount: 0, totalSize: 0 };
  }
}
