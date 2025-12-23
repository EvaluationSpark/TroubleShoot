/**
 * Fix Stuff - TypeScript Data Models
 * Company: RentMouse
 * Location: Edmonton, Alberta, Canada
 */

// ============ ENUMS ============

export enum SkillLevel {
  Beginner = 'beginner',
  DIY = 'diy',
  Pro = 'pro'
}

export enum RiskLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical'
}

export enum ReportReason {
  Inappropriate = 'inappropriate',
  Spam = 'spam',
  Dangerous = 'dangerous',
  Misleading = 'misleading',
  Other = 'other'
}

export enum VideoProvider {
  YouTube = 'youtube',
  Vimeo = 'vimeo',
  Internal = 'internal'
}

// ============ REQUEST MODELS ============

export interface RepairRequest {
  imageBase64: string;
  language?: string;
  modelNumber?: string;
  userDescription?: string;
  category?: string;
  skillLevel?: SkillLevel;
}

export interface DiagnosticAnswers {
  [questionId: number]: string;
}

export interface RefineRequest {
  itemType: string;
  initialAnalysis: any;
  diagnosticAnswers: DiagnosticAnswers;
}

// ============ REPAIR MODELS ============

export interface Step {
  id: string;
  order: number;
  instruction: string;
  detailedHelp?: string;
  completed: boolean;
  estimatedTimeMinutes?: number;
  safetyNote?: string;
  videoKeywords?: string[];
}

export interface ToolItem {
  name: string;
  required: boolean;
  alternative?: string;
  estimatedCost?: number;
}

export interface PartItem {
  name: string;
  quantity: number;
  estimatedCost?: number;
  required: boolean;
  amazonSearchUrl?: string;
  specifications?: string;
}

export interface CostEstimate {
  low: number;
  typical: number;
  high: number;
  currency: string;
  partsBreakdown: {
    name: string;
    cost: number;
  }[];
  toolsCost: number;
  laborHoursRange?: {
    min: number;
    max: number;
  };
  assumptions: string[];
}

export interface TimeEstimate {
  prep: number;
  active: number;
  cure?: number;
  total: number;
  unit: 'minutes' | 'hours';
}

export interface RepairPlan {
  repairId: string;
  itemType: string;
  modelNumber?: string;
  damageDescription: string;
  difficulty: string;
  estimatedTime: string;
  costEstimate?: CostEstimate;
  timeEstimate?: TimeEstimate;
  repairSteps: Step[];
  toolsNeeded: ToolItem[];
  partsNeeded: PartItem[];
  safetyTips: string[];
  riskLevel?: RiskLevel;
  confidenceScore?: number;
  stopAndCallPro?: boolean;
  assumptions?: string[];
  clarifyingQuestions?: string[];
  diagram?: string;
  diagramBase64?: string;
  timestamp: Date;
}

// ============ PROGRESS TRACKING ============

export interface RepairProgress {
  id: string;
  repairId: string;
  title: string;
  notes?: string;
  progressPercentage: number;
  stepsCompleted: number;
  totalSteps: number;
  startedAt: Date;
  lastUpdated: Date;
  completedAt?: Date;
  photosProgress?: string[];
  estimatedSavings?: number;
  skillLevel?: SkillLevel;
  // Full repair data for offline access
  itemType?: string;
  repairSteps?: Step[];
  toolsNeeded?: ToolItem[];
  partsNeeded?: PartItem[];
  diagramBase64?: string;
  repairDifficulty?: string;
  estimatedTime?: string;
  savedForLater?: boolean;
}

// ============ COMMUNITY MODELS ============

export interface CommunityPost {
  id: string;
  title: string;
  description: string;
  itemType: string;
  category?: string;
  beforeImage: string;
  afterImage?: string;
  repairStepsUsed: string[];
  tips?: string;
  userName: string;
  timestamp: Date;
  likes: number;
  reported?: boolean;
  moderated?: boolean;
  reportCount?: number;
  hidden?: boolean;
}

export interface Report {
  id: string;
  postId: string;
  reason: ReportReason;
  additionalInfo?: string;
  reportedBy: string;
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  moderatorNotes?: string;
  actionTaken?: string;
}

// ============ VIDEO MODELS ============

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  provider: VideoProvider;
  relevanceScore?: number;
  keywords?: string[];
}

// ============ LOCAL PRO MODELS ============

export interface ProListing {
  id: string;
  name: string;
  specialization: string;
  address: string;
  phone: string;
  email?: string;
  rating: number;
  reviewsCount: number;
  distance: string;
  estimatedCost: string;
  hours: string;
  website?: string;
  verified?: boolean;
  latitude?: number;
  longitude?: number;
}

// ============ HISTORY & INSIGHTS ============

export interface RepairHistory {
  totalRepairs: number;
  completedRepairs: number;
  inProgressRepairs: number;
  totalTimeSavedMinutes: number;
  totalMoneySaved: number;
  mostCommonCategory: string;
  categoryBreakdown: {
    category: string;
    count: number;
  }[];
  monthlyTrends: {
    month: string;
    repairs: number;
  }[];
}

// ============ USER PREFERENCES ============

export interface UserPreferences {
  skillLevel: SkillLevel;
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  language: string;
  remindersEnabled: boolean;
  defaultReminderHours: number;
}

// ============ EXPORT MODELS ============

export interface ExportOptions {
  includePhotos: boolean;
  includeProgress: boolean;
  includeNotes: boolean;
  format: 'pdf' | 'html';
}

export interface ShareableRepair {
  repairPlan: RepairPlan;
  progress?: RepairProgress;
  exportOptions: ExportOptions;
  generatedAt: Date;
}

// ============ NOTIFICATION MODELS ============

export interface ReminderNotification {
  id: string;
  repairId: string;
  title: string;
  message: string;
  scheduledFor: Date;
  sent: boolean;
  dismissed: boolean;
}

// ============ STORAGE VERSION ============

export interface StorageSchema {
  version: number;
  lastUpdated: Date;
  migrations: {
    version: number;
    appliedAt: Date;
  }[];
}

// ============ API RESPONSE MODELS ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============ ANALYTICS (OPTIONAL) ============

export interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

// ============ TYPE GUARDS ============

export function isRepairProgress(obj: any): obj is RepairProgress {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.repairId === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.progressPercentage === 'number'
  );
}

export function isCommunityPost(obj: any): obj is CommunityPost {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.itemType === 'string'
  );
}

export function isSkillLevel(value: any): value is SkillLevel {
  return Object.values(SkillLevel).includes(value);
}

export function isRiskLevel(value: any): value is RiskLevel {
  return Object.values(RiskLevel).includes(value);
}
