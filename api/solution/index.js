import { connectDB } from "../_lib/mongodb.js";
import { handleCors } from "../_lib/auth.js";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

// Import models
import SolutionCache from "../../models/SolutionCache.js";

// Qubrid AI Configuration
const QUBRID_API_URL = "https://platform.qubrid.com/api/v1/qubridai/chat/completions";
const QUBRID_MODEL = "Qwen/Qwen3-Coder-30B-A3B-Instruct";

// Lazy-load Redis (for serverless - env vars may not be available at module load)
let redis = null;
function getRedis() {
  if (redis) return redis;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  console.log("[REDIS DEBUG] URL:", redisUrl ? "✓ Set" : "✗ Missing");
  console.log("[REDIS DEBUG] Token:", redisToken ? "✓ Set" : "✗ Missing");
  if (redisUrl && redisToken) {
    redis = new Redis({ url: redisUrl, token: redisToken });
    console.log("[REDIS DEBUG] Client created");
  } else {
    console.log("[REDIS DEBUG] Missing credentials, Redis disabled");
  }
  return redis;
}

// Normalize question name
const normalizeQuestionName = (name) => {
  return name.toLowerCase().trim().replace(/[-_]/g, ' ').replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
};

// Create cache key
const createCacheKey = (questionName, language, problemDescription) => {
  const normalizedName = normalizeQuestionName(questionName);
  const normalizedLang = language.toLowerCase().trim();
  const normalizedDesc = (problemDescription || "").toLowerCase().trim().replace(/\s+/g, ' ');
  const input = `${normalizedName}:${normalizedLang}:${normalizedDesc}`;
  const hash = crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
  return `solution:${hash}`;
};

// Generate from Qubrid
async function generateFromQubrid(questionName, language, problemDescription) {
  const prompt = `You are a DSA problem solver. Solve this problem with multiple approaches.

PROBLEM: ${questionName}
LANGUAGE: ${language}
${problemDescription ? `DESCRIPTION: ${problemDescription}` : "If problem name is ambiguous, state your interpretation before solving."}

TASK: Provide Brute Force, Better (if exists), and Optimal solutions.

RULES:
- If brute force IS optimal, provide both fields with same content and add a note.
- If no "better" approach exists, set better to null.
- Code must be clean ${language} without markdown fences.
- Add minimal inline comments in code.
- Be comprehensive but concise.

REQUIRED JSON OUTPUT:
{
  "problemStatement": "2-3 sentence problem explanation",
  "difficulty": "Easy|Medium|Hard",
  "bruteForce": {
    "name": "Approach name",
    "intuition": "3-4 sentences explaining why this works",
    "steps": ["Step 1...", "Step 2...", "...6-8 detailed steps"],
    "code": "Clean ${language} code with comments",
    "timeComplexity": "O(...)",
    "timeComplexityReason": "2-3 sentences",
    "spaceComplexity": "O(...)",
    "spaceComplexityReason": "2-3 sentences"
  },
  "better": null | same structure,
  "optimal": same structure as bruteForce,
  "note": "Explanation if brute=optimal, else null",
  "edgeCases": ["5-6 specific edge cases with brief explanations"],
  "dsaCategory": "Arrays & Hashing | Trees | Graphs | DP | etc.",
  "pattern": "Two Pointers | Sliding Window | BFS | etc.",
  "keyInsights": ["5-6 key insights including pattern recognition and common mistakes"]
}`;

  const response = await fetch(QUBRID_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.QUBRID_API_KEY}`
    },
    body: JSON.stringify({
      model: QUBRID_MODEL,
      messages: [
        { role: "system", content: "You are an expert DSA tutor. Provide comprehensive, educational solutions. Always output valid JSON only." },
        { role: "user", content: prompt }
      ],
      max_tokens: 8192,
      temperature: 0.7,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Qubrid API error: ${response.status} - ${errorText.slice(0, 100)}`);
  }

  const data = await response.json();
  let text = data.choices?.[0]?.message?.content || "";

  // Clean markdown fences
  if (text.startsWith("```json")) text = text.slice(7);
  if (text.startsWith("```")) text = text.slice(3);
  if (text.endsWith("```")) text = text.slice(0, -3);
  text = text.trim();

  const parsed = JSON.parse(text);

  // Clean code fields
  const cleanCode = (code) => {
    if (!code) return code;
    return code.replace(/^```\w*\n?/gm, '').replace(/\n?```$/gm, '').trim();
  };

  if (parsed.bruteForce?.code) parsed.bruteForce.code = cleanCode(parsed.bruteForce.code);
  if (parsed.better?.code) parsed.better.code = cleanCode(parsed.better.code);
  if (parsed.optimal?.code) parsed.optimal.code = cleanCode(parsed.optimal.code);

  return parsed;
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    const { questionName, language, problemDescription } = req.body;

    if (!questionName || !language) {
      return res.status(400).json({ error: "questionName and language are required" });
    }

    const cacheKey = createCacheKey(questionName, language, problemDescription);
    const redisClient = getRedis();

    // Try Redis first
    if (redisClient) {
      try {
        console.log("[REDIS DEBUG] Checking cache for key:", cacheKey);
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          console.log("[REDIS DEBUG] ✓ HIT!");
          const data = typeof cached === "string" ? JSON.parse(cached) : cached;
          return res.json({ success: true, fromCache: true, data: { ...data, tier: "redis" } });
        }
        console.log("[REDIS DEBUG] ✗ MISS");
      } catch (e) {
        console.error("[REDIS DEBUG] Read error:", e.message);
      }
    }

    // Try MongoDB
    const mongoCached = await SolutionCache.findOne({
      questionName: normalizeQuestionName(questionName),
      language: language.toLowerCase().trim()
    });
    if (mongoCached) {
      // Backfill Redis
      const rc = getRedis();
      if (rc) rc.set(cacheKey, JSON.stringify(mongoCached.solution), { ex: 7 * 24 * 60 * 60 });
      await SolutionCache.findByIdAndUpdate(mongoCached._id, { $inc: { hitCount: 1 } });
      return res.json({ success: true, fromCache: true, data: { ...mongoCached.solution, tier: "mongodb", hits: mongoCached.hitCount + 1 } });
    }

    // Generate fresh
    const solution = await generateFromQubrid(questionName, language, problemDescription);

    // Save to caches
    const rc2 = getRedis();
    if (rc2) {
      try {
        await rc2.set(cacheKey, JSON.stringify(solution), { ex: 7 * 24 * 60 * 60 });
        console.log("[REDIS DEBUG] ✓ Saved to Redis");
      } catch (e) {
        console.error("[REDIS DEBUG] Write error:", e.message);
      }
    }
    await SolutionCache.findOneAndUpdate(
      { questionName: normalizeQuestionName(questionName), language: language.toLowerCase().trim() },
      { $set: { solution, originalName: questionName }, $setOnInsert: { hitCount: 0, createdAt: new Date() } },
      { upsert: true }
    );

    return res.json({ success: true, fromCache: false, data: { ...solution, tier: "qubrid" } });
  } catch (error) {
    console.error("Solution API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate solution" });
  }
}
