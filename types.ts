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

export interface SolutionApproach {
  name: string;
  intuition: string;
  steps: string[];
  code: string;
  timeComplexity: string;
  timeComplexityReason?: string;
  spaceComplexity: string;
  spaceComplexityReason?: string;
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