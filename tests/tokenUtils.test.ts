import { describe, it, expect } from 'vitest';
import { estimateTokens, stripComments } from '../utils/tokenUtils';

describe('Token Utils', () => {
  describe('estimateTokens', () => {
    it('should correctly estimate tokens for simple text', () => {
      const text = 'Hello world';
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10);
    });

    it('should handle empty string', () => {
      const tokens = estimateTokens('');
      expect(tokens).toBe(0);
    });

    it('should handle code snippets', () => {
      const code = `
      function test() {
        return 1 + 1;
      }
    `;
      const tokens = estimateTokens(code);
      expect(tokens).toBeGreaterThan(5);
    });
  });

  describe('stripComments', () => {
    it('should remove single line comments', () => {
      const code = '// comment\nconst x = 1;';
      const result = stripComments(code, 'javascript');
      expect(result).not.toContain('//');
    });

    it('should remove block comments', () => {
      const code = '/* block comment */\nconst x = 1;';
      const result = stripComments(code, 'javascript');
      expect(result).not.toContain('/*');
    });
  });
});
