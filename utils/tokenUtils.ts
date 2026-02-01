/**
 * Removes comments from code strings to save tokens and ensure AI analyzes only executable logic.
 * Supports:
 * - Single line comments (//)
 * - Multi-line comments (slash-star ... star-slash)
 * - Python hash comments (#)
 */
export const stripComments = (
  code: string,
  language: string = 'javascript'
): string => {
  if (!code) return '';

  const lang = language.toLowerCase();

  // Python / Ruby / Shell / YAML style (# comments)
  if (['python', 'ruby', 'bash', 'shell', 'yaml', 'yml'].includes(lang)) {
    return code
      .replace(/#[^\n]*/g, '') // Remove hash comments
      .replace(/'''[\s\S]*?'''/g, '') // Remove triple single-quote docstrings
      .replace(/"""[\s\S]*?"""/g, '') // Remove triple double-quote docstrings
      .replace(/^\s*[\r\n]/gm, ''); // Remove empty lines
  }

  // C-style languages (JS, TS, Java, C++, Go, Rust, etc.)
  // Handles: // line comments and /* block comments */
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/[^\n]*/g, '') // Remove line comments
    .replace(/^\s*[\r\n]/gm, ''); // Remove empty lines
};

/**
 * Estimates token count for a given text (approximate).
 * Rule of thumb: 1 token ~= 4 chars in English
 */
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};
