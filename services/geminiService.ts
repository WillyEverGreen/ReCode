import { GoogleGenAI, Type } from "@google/genai";
import { SubmissionData, AIAnalysisResult } from "../types";

const generatePrompt = (data: SubmissionData): string => {
  return `
You are a LeetCode solution analyzer and a DSA revision assistant.
Your job is to convert a user’s submission into **ultra-fast revision notes**.

---------------------
### INPUT
Problem URL: ${data.problemUrl || "N/A"}

USER CODE:
\`\`\`
${data.code}
\`\`\`

---------------------
### INSTRUCTIONS

Analyze the code and populate the JSON response fields based on the following content guidelines.
**IMPORTANT**: 
- The user has NOT provided the Problem Title or Language. You MUST infer them.
- **DO NOT USE NUMBERED HEADINGS** (e.g., do NOT say "1. Problem Summary"). Use simple "## Heading" format if needed within markdown fields.

#### Field: problemOverview
- Explain what the problem demands in short (2-3 lines). 
- Do NOT include test cases here.

#### Field: visualization
- Create a clear ASCII art or text-based diagram illustrating the primary test case. 
- Example: Draw the Tree structure, or show the Array with pointers, or a Matrix grid.
- Make it visual and easy to understand at a glance.

#### Field: testCases
- Provide 2-3 specific Test Cases using strict, minimal formatting.
- Format strictly as follows for each case:
  Test Case X:
  Input: \`...\`
  Output: \`...\`
  Explanation: <1–3 short lines>
- Do NOT use bold (**), headers (###), or heavy markdown.
- Keep it clean and minimal.

#### Field: coreLogic
Generate Markdown containing these sections (Use ## Headers):
- **Core Pattern Used**: Identify the main DSA pattern.
- **15-Second Revision Trick**: A fast recall memory hook.
- **Step-by-Step Approach**: 5–8 short bullets.
- **Why This Works**: Concise conceptual reasoning.

#### Field: edgeCases
- A Markdown list of at least 6 High-Yield Edge Cases.

#### Field: syntaxNotes
- A simple, high-yield 'Cheat Sheet' for the language inferred.
- List key methods or syntax used in the solution (e.g., Map methods, Queue operations).
- Keep it brief and memory-friendly.

#### Field: improvementMarkdown
Generate Markdown containing:
- **Potential Improvements**: Refactoring tips.
- **Final Polished Code**: The user's code refactored for readability.

#### Other Fields
- **dsaCategory**: Primary category (e.g. "Arrays & Hashing").
- **pattern**: Specific technique (e.g. "Sliding Window").
- **timeComplexity**: Big-O.
- **spaceComplexity**: Big-O.
- **revisionNotes**: Array of 3-5 short flashcard bullets.
`;
};

export const analyzeSubmission = async (data: SubmissionData): Promise<AIAnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: generatePrompt(data),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Inferred Problem Title" },
            language: { type: Type.STRING, description: "Inferred Language" },
            dsaCategory: { type: Type.STRING, description: "Primary DSA Category" },
            pattern: { type: Type.STRING, description: "Core Pattern used" },
            timeComplexity: { type: Type.STRING, description: "Big-O Time Complexity" },
            spaceComplexity: { type: Type.STRING, description: "Big-O Space Complexity" },
            revisionNotes: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of 3-5 short recall tricks for flashcards" 
            },
            problemOverview: { type: Type.STRING, description: "Short summary only" },
            visualization: { type: Type.STRING, description: "ASCII Art diagram of test case" },
            testCases: { type: Type.STRING, description: "Minimal formatted test cases" },
            coreLogic: { type: Type.STRING, description: "Pattern, Trick, Approach, Reasoning" },
            edgeCases: { type: Type.STRING, description: "List of edge cases" },
            syntaxNotes: { type: Type.STRING, description: "Language specific syntax notes" },
            improvementMarkdown: { type: Type.STRING, description: "Improvements and Polished Code" }
          },
          required: [
            "title", 
            "language", 
            "dsaCategory", 
            "pattern", 
            "timeComplexity", 
            "spaceComplexity", 
            "revisionNotes", 
            "problemOverview",
            "visualization",
            "testCases",
            "coreLogic",
            "edgeCases",
            "syntaxNotes",
            "improvementMarkdown"
          ]
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from Gemini.");
    }

    return JSON.parse(text) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze code. Please ensure the code is valid.");
  }
};