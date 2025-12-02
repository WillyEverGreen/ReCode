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
  showVisualization: boolean;
  showTestCases: boolean;
}

export interface AIAnalysisResult {
  title: string;
  language: string;
  dsaCategory: string;
  pattern: string;
  timeComplexity: string;
  spaceComplexity: string;
  
  // Granular Content Fields
  problemOverview: string; // Summary ONLY
  testCases: string;       // Markdown of test cases
  visualization: string;   // ASCII diagram of the test case
  coreLogic: string;       // Pattern, Trick, Approach, Why it works
  edgeCases: string;       // Toggleable section
  syntaxNotes: string;     // Toggleable section
  improvementMarkdown: string; // Suggestions + Polished Code
  
  revisionNotes: string[]; // Flashcards
}

export interface SavedQuestion extends Omit<SubmissionData, 'title' | 'language'>, AIAnalysisResult {
  id: string;
  timestamp: number;
}

export type ViewState = 'dashboard' | 'add' | 'detail';