import { z } from 'zod';

// API Response Schemas
export const UserSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  plan: z.enum(['free', 'pro', 'premium']).default('free'),
  isPro: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
});

export const QuestionSchema = z.object({
  id: z.string(),
  title: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  category: z.string(),
  topics: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const AnalysisResultSchema = z.object({
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  explanation: z.string(),
  optimizations: z.array(z.string()).optional(),
  patterns: z.array(z.string()).optional(),
});

export const SolutionSchema = z.object({
  code: z.string(),
  explanation: z.string(),
  language: z.string(),
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
});

// API Request Schemas
export const AnalyzeCodeRequestSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  language: z.string().default('javascript'),
  questionId: z.string().optional(),
});

export const GetSolutionRequestSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  language: z.string().default('javascript'),
});

export const AuthRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const OTPVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// Usage tracking
export const UsageRecordSchema = z.object({
  userId: z.string(),
  action: z.enum(['analyze', 'solution', 'tree']),
  timestamp: z.string().datetime().optional(),
  limit: z.number().int().positive(),
  used: z.number().int().nonnegative(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type Solution = z.infer<typeof SolutionSchema>;
export type AnalyzeCodeRequest = z.infer<typeof AnalyzeCodeRequestSchema>;
export type GetSolutionRequest = z.infer<typeof GetSolutionRequestSchema>;
export type AuthRequest = z.infer<typeof AuthRequestSchema>;
export type OTPVerify = z.infer<typeof OTPVerifySchema>;
export type UsageRecord = z.infer<typeof UsageRecordSchema>;

// Validation helper
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
