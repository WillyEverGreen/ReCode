import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { SolutionResult, SolutionApproach } from "../types";
import { generateSolution } from "../services/aiService";
import {
  Sparkles,
  Loader2,
  Clock,
  Activity,
  AlertTriangle,
  Lightbulb,
  Zap,
  TrendingUp,
  Crown,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import ProBadge from "./ProBadge";
import ExportDropdown from "./ExportDropdown";

const LANGUAGES = ["Python", "JavaScript", "Java", "C++", "TypeScript", "Go"];

const GetSolution: React.FC = () => {
  const [questionName, setQuestionName] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("Python");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solution, setSolution] = useState<SolutionResult | null>(null);
  const [activeApproach, setActiveApproach] = useState<"brute" | "better" | "optimal">("optimal");
  const [copiedCode, setCopiedCode] = useState(false);

  const handleGenerate = async () => {
    if (!questionName.trim()) {
      setError("Please enter a question name");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSolution(null);

    try {
      const result = await generateSolution(
        questionName.trim(),
        selectedLanguage,
        problemDescription.trim() || undefined
      );
      setSolution(result);
      setActiveApproach("optimal");
    } catch (err: any) {
      setError(err.message || "Failed to generate solution");
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentApproach = (): SolutionApproach | null => {
    if (!solution) return null;
    if (activeApproach === "brute") return solution.bruteForce;
    if (activeApproach === "better") return solution.better || null;
    return solution.optimal;
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const MarkdownRenderer = ({ content }: { content: string }) => (
    <ReactMarkdown
      components={{
        h2: ({ node, ...props }) => (
          <h2 className="text-lg font-semibold text-[#e6c888] mt-6 mb-3" {...props} />
        ),
        p: ({ node, ...props }) => (
          <p className="text-[#cccccc] mb-3 leading-relaxed" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc ml-5 mb-3 text-[#cccccc] space-y-1" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal ml-5 mb-3 text-[#cccccc] space-y-1" {...props} />
        ),
        strong: ({ node, ...props }) => (
          <strong className="font-bold text-white" {...props} />
        ),
        code({ node, className, children, ...props }) {
          const isInline = !String(children).includes("\n");
          if (isInline) {
            return (
              <code className="bg-gray-800/50 text-[#e6c888] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          }
          return (
            <SyntaxHighlighter
              children={String(children).replace(/\n$/, "")}
              style={atomDark}
              language="text"
              PreTag="div"
              customStyle={{ margin: 0, padding: "1rem", backgroundColor: "#0c0c0c", borderRadius: "8px" }}
              {...props}
            />
          );
        },
      }}
    >
      {content || ""}
    </ReactMarkdown>
  );

  const currentApproach = getCurrentApproach();

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          Get Solution
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Get brute force, better, and optimal solutions with step-by-step explanations.
        </p>
      </div>

      {/* Input Form */}
      {!solution && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Preferred Language
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedLanguage === lang
                      ? "bg-yellow-500 text-black"
                      : "bg-gray-950 text-gray-400 border border-gray-700 hover:border-yellow-500/50 hover:text-white"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Question Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Question Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={questionName}
              onChange={(e) => setQuestionName(e.target.value)}
              placeholder="e.g., Two Sum, Valid Parentheses, Merge Intervals"
              className="w-full bg-gray-950 text-white border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-colors"
              disabled={isLoading}
            />
          </div>

          {/* Problem Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Problem Description{" "}
              <span className="text-gray-500 font-normal">(optional - for new/obscure problems)</span>
            </label>
            <textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Paste the full problem description here if the AI doesn't recognize the problem name..."
              rows={5}
              className="w-full bg-gray-950 text-white border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-colors resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !questionName.trim()}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              isLoading || !questionName.trim()
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Solutions...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Solution
              </>
            )}
          </button>
        </div>
      )}

      {/* Solution Display */}
      {solution && (
        <div className="space-y-6 animate-in fade-in">
          {/* Reset Button */}
          <button
            onClick={() => {
              setSolution(null);
              setQuestionName("");
              setProblemDescription("");
            }}
            className="text-sm text-gray-400 hover:text-[#e6c888] transition-colors"
          >
            ← Generate another solution
          </button>

          {/* Question Info Header */}
          <div className="bg-[#0a0d12] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-2xl font-bold text-white">{questionName}</h3>
              <ExportDropdown
                data={{
                  title: questionName,
                  code: getCurrentApproach()?.code || '',
                  language: selectedLanguage,
                  timeComplexity: getCurrentApproach()?.timeComplexity,
                  spaceComplexity: getCurrentApproach()?.spaceComplexity,
                }}
              />
            </div>
            <div className="flex gap-3 mt-3 flex-wrap">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#e6c888]/10 text-[#e6c888] border border-[#e6c888]/20">
                {solution.dsaCategory}
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {solution.pattern}
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {selectedLanguage}
              </span>
            </div>
            <p className="text-[#cccccc] mt-4 leading-relaxed">{solution.problemStatement}</p>
          </div>

          {/* Key Insights */}
          {solution.keyInsights && solution.keyInsights.length > 0 && (
            <div className="bg-gradient-to-r from-[#e6c888]/5 to-transparent border border-[#e6c888]/20 rounded-xl p-6">
              <h4 className="text-sm font-bold text-[#e6c888] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Key Insights
              </h4>
              <div className="grid gap-3">
                {solution.keyInsights.map((insight, idx) => (
                  <div key={idx} className="flex gap-3 text-[#cccccc]">
                    <ChevronRight className="w-4 h-4 text-[#e6c888] flex-shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note about approach availability */}
          {solution.note && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-blue-300 text-sm flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{solution.note}</span>
            </div>
          )}

          {/* Approach Tabs */}
          <div className="flex gap-3">
            <button
              onClick={() => setActiveApproach("brute")}
              className={`flex items-baseline gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                activeApproach === "brute"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-[#141414] text-gray-400 border border-gray-800 hover:border-red-500/30 hover:text-red-400"
              }`}
            >
              <Zap className="w-4 h-4 self-center" />
              Brute Force
              <span className="text-xs opacity-60 font-mono">{solution.bruteForce.timeComplexity}</span>
            </button>
            
            {solution.better && (
              <button
                onClick={() => setActiveApproach("better")}
                className={`flex items-baseline gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeApproach === "better"
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "bg-[#141414] text-gray-400 border border-gray-800 hover:border-yellow-500/30 hover:text-yellow-400"
                }`}
              >
                <TrendingUp className="w-4 h-4 self-center" />
                Better
                <span className="text-xs opacity-60 font-mono">{solution.better.timeComplexity}</span>
              </button>
            )}
            
            <button
              onClick={() => setActiveApproach("optimal")}
              className={`flex items-baseline gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                activeApproach === "optimal"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-[#141414] text-gray-400 border border-gray-800 hover:border-green-500/30 hover:text-green-400"
              }`}
            >
              <Crown className="w-4 h-4 self-center" />
              Optimal
              <span className="text-xs opacity-60 font-mono">{solution.optimal.timeComplexity}</span>
            </button>
          </div>

          {/* Current Approach Content */}
          {currentApproach && (
            <div className="bg-[#141414] border border-gray-800 rounded-2xl overflow-hidden">
              {/* Approach Header */}
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    {activeApproach === "brute" && <Zap className="w-5 h-5 text-red-400" />}
                    {activeApproach === "better" && <TrendingUp className="w-5 h-5 text-yellow-400" />}
                    {activeApproach === "optimal" && <Crown className="w-5 h-5 text-green-400" />}
                    {currentApproach.name}
                  </h4>
                </div>
                
                {/* Complexity Note - Only shown when explaining missing approaches or why brute=optimal */}
                {(currentApproach as any).complexityNote && (
                  <div className="mb-4 bg-gradient-to-r from-amber-500/5 to-transparent border-l-4 border-amber-500/50 p-3 rounded-r-lg">
                    <p className="text-sm text-amber-100/90 leading-relaxed flex items-start gap-2">
                      <span className="text-amber-400">💡</span>
                      <span>{(currentApproach as any).complexityNote}</span>
                    </p>
                  </div>
                )}
                
                {/* Complexity Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0c0c0c] border border-gray-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">
                      <Clock className="w-3 h-3" /> Time
                    </div>
                    <div className="text-white font-mono">{currentApproach.timeComplexity}</div>
                    {(currentApproach as any).timeComplexityReason && (
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        {(currentApproach as any).timeComplexityReason}
                      </p>
                    )}
                  </div>
                  <div className="bg-[#0c0c0c] border border-gray-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">
                      <Activity className="w-3 h-3" /> Space
                    </div>
                    <div className="text-white font-mono">{currentApproach.spaceComplexity}</div>
                    {(currentApproach as any).spaceComplexityReason && (
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        {(currentApproach as any).spaceComplexityReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Intuition */}
              <div className="p-6 border-b border-gray-800">
                <h5 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Intuition</h5>
                <p className="text-[#cccccc] leading-relaxed bg-[#0c0c0c] p-4 rounded-lg border-l-4 border-[#e6c888]">
                  {currentApproach.intuition}
                </p>
              </div>

              {/* Steps */}
              <div className="p-6 border-b border-gray-800">
                <h5 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Step-by-Step Approach</h5>
                <ol className="space-y-3">
                  {currentApproach.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-[#cccccc]">
                      <span className="flex-shrink-0 w-7 h-7 bg-[#e6c888]/10 text-[#e6c888] rounded-full flex items-center justify-center text-sm font-bold border border-[#e6c888]/20">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Code */}
              <div className="p-0">
                <div className="px-6 py-3 bg-[#0a0a0a] border-b border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{selectedLanguage} Code</span>
                  <button
                    onClick={() => copyCode(currentApproach.code)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <SyntaxHighlighter
                  language={selectedLanguage.toLowerCase().replace("c++", "cpp")}
                  style={atomDark}
                  showLineNumbers
                  customStyle={{
                    margin: 0,
                    padding: "1.5rem",
                    backgroundColor: "#0c0c0c",
                    fontSize: "0.9rem",
                  }}
                >
                  {currentApproach.code}
                </SyntaxHighlighter>
              </div>
            </div>
          )}

          {/* Edge Cases */}
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-[#e6c888] mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Edge Cases to Consider
            </h4>
            <ul className="space-y-3">
              {solution.edgeCases.map((edge, idx) => (
                <li key={idx} className="flex gap-3 text-[#cccccc]">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#e6c888]/10 text-[#e6c888] rounded-full flex items-center justify-center text-xs border border-[#e6c888]/20 font-mono">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{edge}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default GetSolution;
