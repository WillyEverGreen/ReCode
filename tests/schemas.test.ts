import { describe, it, expect } from 'vitest';
import { validateSchema } from '../utils/schemas';
import {
  UserSchema,
  QuestionSchema,
  AnalyzeCodeRequestSchema,
  AuthRequestSchema,
  OTPVerifySchema,
} from '../utils/schemas';

describe('Schema Validation', () => {
  describe('UserSchema', () => {
    it('should validate a valid user object', () => {
      const validUser = {
        _id: '123456',
        email: 'test@example.com',
        plan: 'free',
        isPro: false,
      };

      const result = validateSchema(UserSchema, validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should reject invalid email', () => {
      const invalidUser = {
        _id: '123456',
        email: 'invalid-email',
        plan: 'free',
        isPro: false,
      };

      const result = validateSchema(UserSchema, invalidUser);
      expect(result.success).toBe(false);
    });

    it('should set default plan to free', () => {
      const userWithoutPlan = {
        _id: '123456',
        email: 'test@example.com',
        isPro: false,
      };

      const result = validateSchema(UserSchema, userWithoutPlan);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.plan).toBe('free');
      }
    });
  });

  describe('QuestionSchema', () => {
    it('should validate a valid question', () => {
      const validQuestion = {
        id: 'two-sum',
        title: 'Two Sum',
        difficulty: 'Easy',
        category: 'Arrays',
        topics: ['Array', 'Hash Table'],
      };

      const result = validateSchema(QuestionSchema, validQuestion);
      expect(result.success).toBe(true);
    });

    it('should reject invalid difficulty', () => {
      const invalidQuestion = {
        id: 'test',
        title: 'Test',
        difficulty: 'Invalid',
        category: 'Test',
      };

      const result = validateSchema(QuestionSchema, invalidQuestion);
      expect(result.success).toBe(false);
    });
  });

  describe('AnalyzeCodeRequestSchema', () => {
    it('should validate valid analyze request', () => {
      const validRequest = {
        code: 'function test() { return 1; }',
        language: 'javascript',
        questionId: 'two-sum',
      };

      const result = validateSchema(AnalyzeCodeRequestSchema, validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty code', () => {
      const invalidRequest = {
        code: '',
        language: 'javascript',
      };

      const result = validateSchema(AnalyzeCodeRequestSchema, invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should use default language', () => {
      const requestWithoutLang = {
        code: 'test code',
      };

      const result = validateSchema(
        AnalyzeCodeRequestSchema,
        requestWithoutLang
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.language).toBe('javascript');
      }
    });
  });

  describe('AuthRequestSchema', () => {
    it('should validate valid auth request', () => {
      const validAuth = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = validateSchema(AuthRequestSchema, validAuth);
      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const invalidAuth = {
        email: 'test@example.com',
        password: '123',
      };

      const result = validateSchema(AuthRequestSchema, invalidAuth);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const invalidAuth = {
        email: 'not-an-email',
        password: 'password123',
      };

      const result = validateSchema(AuthRequestSchema, invalidAuth);
      expect(result.success).toBe(false);
    });
  });

  describe('OTPVerifySchema', () => {
    it('should validate valid OTP', () => {
      const validOTP = {
        email: 'test@example.com',
        otp: '123456',
      };

      const result = validateSchema(OTPVerifySchema, validOTP);
      expect(result.success).toBe(true);
    });

    it('should reject OTP with wrong length', () => {
      const invalidOTP = {
        email: 'test@example.com',
        otp: '123',
      };

      const result = validateSchema(OTPVerifySchema, invalidOTP);
      expect(result.success).toBe(false);
    });
  });
});
