export enum SupportedLanguage {
  Python = 'Python',
  JavaScript = 'JavaScript',
  TypeScript = 'TypeScript',
  Java = 'Java',
  CPP = 'C++',
  Go = 'Go',
  Rust = 'Rust',
  Other = 'Other'
}

export interface SubmissionData {
  title?: string;
  problemUrl?: string;
  language?: string;
  tags?: string;
  code: string;
}

export interface UserSettings {
  showEdgeCases: boolean;
  showSyntaxNotes: boolean;
  showTestCases: boolean;
}

export interface AIAnalysisResult {
  title: string;
  language: string;
  dsaCategory: string;
  pattern: string;
  timeComplexity: string;
  timeComplexityReason?: string;
  spaceComplexity: string;
  spaceComplexityReason?: string;
  
  // Granular Content Fields
  problemOverview: string; // Summary ONLY
  testCases: string | string[];       // Markdown of test cases
  coreLogic: string | string[] | Record<string, any>;       // Pattern, Trick, Approach, Why it works
  edgeCases: string | string[];       // Toggleable section
  syntaxNotes: string | string[];     // Toggleable section
  improvementMarkdown: string; // Suggestions + Polished Code
  
  revisionNotes: string[]; // Quick revision bullets
}

export interface SavedQuestion extends Omit<SubmissionData, 'title' | 'language'>, AIAnalysisResult {
  id: string;
  timestamp: number;
}

export type ViewState = 'dashboard' | 'add' | 'detail' | 'solution' | 'pricing';

// Complexity case (average vs worst)
export interface ComplexityCase {
  time: string;
  space: string;
  explanation: string;
}

// Dual complexity analysis result
export interface DualComplexityAnalysis {
  averageCase: ComplexityCase;
  worstCase: ComplexityCase;
  confidence: number;
  source: 'ground-truth-title' | 'ground-truth-fingerprint' | 'heuristic';
  patterns: string[];
  dataStructures: string[];
  note?: string;
}

export interface SolutionApproach {
  name: string;
  intuition: string;
  steps: string[];
  code: string;
  
  // Legacy single complexity (deprecated but kept for backwards compatibility)
  timeComplexity: string;
  timeComplexityReason?: string;
  spaceComplexity: string;
  spaceComplexityReason?: string;
  
  // NEW: Dual complexity analysis (V2 Engine)
  complexityAnalysis?: DualComplexityAnalysis;
  
  // Mismatch tracking: When engine corrects LLM's TC/SC
  complexityMismatchNote?: string; // LLM's reasoning for why it chose different TC/SC than engine
  llmOriginalTC?: string; // Original TC from LLM before engine correction
  llmOriginalSC?: string; // Original SC from LLM before engine correction
  complexitySource?: 'LLM' | 'Engine' | 'LLM-Reconsidered' | 'EngineV2'; // Source of final complexity values
}

export interface SolutionResult {
  problemStatement: string;
  bruteForce: SolutionApproach;
  better?: SolutionApproach;
  optimal: SolutionApproach;
  note?: string; // Explains if brute=optimal or why no better exists
  edgeCases: string[];
  dsaCategory: string;
  pattern: string;
  keyInsights: string[];
}

// User types
export type UserRole = 'user' | 'admin';
export type UserPlan = 'trial' | 'pro';

export interface User {
  _id: string;
  username: string;
  email: string;
  password?: string;
  isVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  provider: 'email' | 'google' | 'github';
  providerId?: string;
  avatar?: string;
  role: UserRole;
  plan: UserPlan;
  
  // Trial system (7-day trial with daily limits)
  trialStartDate?: Date;
  trialEndDate?: Date;
  trialUsed?: boolean;
  
  // Pro subscription
  planStartDate?: Date;
  planEndDate?: Date;
}
