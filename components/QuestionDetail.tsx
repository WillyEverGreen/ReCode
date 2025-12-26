import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { SavedQuestion, UserSettings } from "../types";
import {
  ArrowLeft,
  Clock,
  Zap,
  FileCode,
  Lightbulb,
  Trash2,
  Settings2,
  CheckSquare,
  TestTube2,
  BookOpen,
  AlertTriangle,
  Code2,
  Activity,
  BrainCircuit,
  Crown,
} from "lucide-react";
import ProBadge from "./ProBadge";

interface QuestionDetailProps {
  question: SavedQuestion;
  userSettings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
  onUpdateQuestion: (question: SavedQuestion) => void;
}

const QuestionDetail: React.FC<QuestionDetailProps> = ({
  question,
  userSettings,
  onUpdateSettings,
  onBack,
  onDelete,
  onUpdateQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<
    "revise" | "code" | "suggestions"
  >("revise");
  const [showSettings, setShowSettings] = useState(false);

  // Helper to render markdown with syntax highlighting
  const MarkdownRenderer = ({ content }: { content: string | string[] | Record<string, any> }) => {
    // Handle array content by joining with newlines
    let markdownContent = "";
    
    // Helper: Strip leading bullets/numbers to allow consistent auto-numbering
    const formatListItem = (item: any, index: number) => {
      // Removes: "- ", "* ", "1. ", "• " but preserves "**Bold**"
      const clean = String(item).replace(/^[\s•]*(?:[-*]\s+|\d+\.\s+|•\s*)/, "");
      return `${index + 1}. ${clean}`;
    };

    if (Array.isArray(content)) {
      markdownContent = content.map(formatListItem).join("\n");
    } else if (typeof content === "object" && content !== null) {
      // Handle object content (like coreLogic)
      markdownContent = Object.entries(content)
        .map(([key, value]) => {
          const formattedValue = Array.isArray(value) 
            ? value.map(formatListItem).join("\n") 
            : value;
          return `### ${key}\n${formattedValue}`;
        })
        .join("\n\n");
    } else {
      // Ensure newlines are respected in markdown by converting distinct lines to paragraphs
      markdownContent = (content as string).replace(/\n/g, "\n\n");
    }

    return (
      <ReactMarkdown
        components={{
          h2: ({ node, ...props }) => (
            <h2
              className="text-xl font-semibold text-[#e6c888] mt-8 mb-4 border-b border-gray-800 pb-2 flex items-center gap-2"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-medium text-white mt-6 mb-3" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-[#cccccc] mb-4 leading-loose" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc ml-6 mb-4 text-[#cccccc] space-y-2 leading-relaxed"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal ml-6 mb-4 text-[#cccccc] space-y-2 leading-relaxed"
              {...props}
            />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-white" {...props} />
          ),
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");

            if (isInline) {
              return (
                <code
                  className="bg-gray-800/50 text-[#e6c888] px-2 py-0.5 rounded-md border border-gray-700/50 text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="my-6 rounded-xl overflow-hidden border border-gray-800 shadow-lg">
                <SyntaxHighlighter
                  children={String(children).replace(/\n$/, "")}
                  style={atomDark}
                  language={match ? match[1] : "text"}
                  PreTag="div"
                  wrapLongLines={true}
                  customStyle={{
                    margin: 0,
                    padding: "1.5rem",
                    backgroundColor: "#0c0c0c",
                  }}
                  {...props}
                />
              </div>
            );
          },
        }}
      >
        {markdownContent || ""}
      </ReactMarkdown>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-right-4 pb-20">
      {/* Sticky Header Container */}
      <div className="sticky top-0 z-20 bg-[#0c0c0c]/95 backdrop-blur-xl border-b border-gray-800/50 pt-6 pb-0 mb-8 -mx-4 px-4 md:-mx-0 md:px-0 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div>
            <button
              onClick={onBack}
              className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#e6c888] mb-3 transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {question.title}
            </h1>
            <div className="flex gap-3 mt-3">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#e6c888]/10 text-[#e6c888] border border-[#e6c888]/20">
                {question.dsaCategory}
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {question.pattern}
              </span>
              {question.problemUrl && (
                <a
                  href={question.problemUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 text-xs font-medium rounded-full bg-gray-800 text-gray-400 hover:text-white border border-gray-700 transition-colors"
                >
                  Original Problem ↗
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {/* Settings Toggle (Only visible in Revise tab) */}
            {activeTab === "revise" && (
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-lg transition-colors ${
                    showSettings
                      ? "bg-[#e6c888] text-black"
                      : "text-gray-500 hover:bg-gray-800 hover:text-white"
                  }`}
                  title="View Options"
                >
                  <Settings2 className="w-5 h-5" />
                </button>

                {showSettings && (
                  <div className="absolute right-0 top-12 w-64 bg-[#141414] border border-gray-800 rounded-lg shadow-xl p-3 z-50">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2 px-1">
                      View Options
                    </div>

                    <button
                      onClick={() =>
                        onUpdateSettings({
                          ...userSettings,
                          showTestCases: !userSettings.showTestCases,
                        })
                      }
                      className="flex items-center gap-3 w-full p-2 text-sm text-[#cccccc] hover:bg-gray-800 rounded-md transition-colors"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          userSettings.showTestCases
                            ? "bg-[#e6c888] border-[#e6c888]"
                            : "border-gray-600"
                        }`}
                      >
                        {userSettings.showTestCases && (
                          <CheckSquare className="w-3 h-3 text-black" />
                        )}
                      </div>
                      Show Test Cases
                    </button>

                    <div className="h-px bg-gray-800 my-2"></div>

                    <button
                      onClick={() =>
                        onUpdateSettings({
                          ...userSettings,
                          showEdgeCases: !userSettings.showEdgeCases,
                        })
                      }
                      className="flex items-center gap-3 w-full p-2 text-sm text-[#cccccc] hover:bg-gray-800 rounded-md transition-colors"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          userSettings.showEdgeCases
                            ? "bg-[#e6c888] border-[#e6c888]"
                            : "border-gray-600"
                        }`}
                      >
                        {userSettings.showEdgeCases && (
                          <CheckSquare className="w-3 h-3 text-black" />
                        )}
                      </div>
                      Show Edge Cases
                    </button>
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          ...userSettings,
                          showSyntaxNotes: !userSettings.showSyntaxNotes,
                        })
                      }
                      className="flex items-center gap-3 w-full p-2 text-sm text-[#cccccc] hover:bg-gray-800 rounded-md transition-colors"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          userSettings.showSyntaxNotes
                            ? "bg-[#e6c888] border-[#e6c888]"
                            : "border-gray-600"
                        }`}
                      >
                        {userSettings.showSyntaxNotes && (
                          <CheckSquare className="w-3 h-3 text-black" />
                        )}
                      </div>
                      Show Syntax Notes
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete this question?"))
                  onDelete(question.id);
              }}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete Question"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("revise")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "revise"
                ? "border-[#e6c888] text-[#e6c888]"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4" /> Quick Revise
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "code"
                ? "border-[#e6c888] text-[#e6c888]"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <FileCode className="w-4 h-4" /> My Code
          </button>
          <button
            onClick={() => setActiveTab("suggestions")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "suggestions"
                ? "border-[#e6c888] text-[#e6c888]"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Lightbulb className="w-4 h-4" /> AI Suggestions
            <ProBadge showLabel={false} />
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-[#141414] border border-gray-800 rounded-2xl p-8 md:p-12 min-h-[600px] relative shadow-2xl shadow-black/50">
        {/* REVISION TAB */}
        {activeTab === "revise" && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* 1. Problem Overview */}
            <div className="custom-markdown">
              <h2 className="text-xl font-semibold text-[#e6c888] mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Problem Overview
              </h2>
              <p className="text-[#cccccc] leading-loose mb-6 text-lg">
                {question.problemOverview}
              </p>

              {/* Test Cases */}
              {userSettings.showTestCases && question.testCases && (
                <div className="mt-8 pt-6 border-t border-gray-800/50">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#e6c888] mb-4 uppercase tracking-wider">
                    <TestTube2 className="w-4 h-4" /> Test Cases
                  </div>
                  <MarkdownRenderer content={question.testCases} />
                </div>
              )}
            </div>

            {/* Complexity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0c0c0c] border border-gray-800 p-6 rounded-xl hover:border-[#e6c888]/30 transition-colors group">
                <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider font-bold mb-3 group-hover:text-[#e6c888] transition-colors">
                  <Clock className="w-4 h-4" /> Time Complexity
                </div>
                <div className="text-white font-mono text-lg">
                  {question.timeComplexity}
                </div>
                {question.timeComplexityReason && (
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {question.timeComplexityReason}
                  </p>
                )}
              </div>
              <div className="bg-[#0c0c0c] border border-gray-800 p-6 rounded-xl hover:border-[#e6c888]/30 transition-colors group">
                <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider font-bold mb-3 group-hover:text-[#e6c888] transition-colors">
                  <Activity className="w-4 h-4" /> Space Complexity
                </div>
                <div className="text-white font-mono text-lg">
                  {question.spaceComplexity}
                </div>
                {question.spaceComplexityReason && (
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {question.spaceComplexityReason}
                  </p>
                )}
              </div>
            </div>

            {/* Checklist */}
            {question.revisionNotes && question.revisionNotes.length > 0 && (
              <div className="bg-[#0c0c0c] p-8 rounded-xl border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#e6c888]" /> Fast Recall
                  Checklist
                  <ProBadge />
                </h3>
                <ul className="space-y-4">
                  {question.revisionNotes.map((note, idx) => (
                    <li key={idx} className="flex gap-4 text-[#cccccc]">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#e6c888]/10 text-[#e6c888] rounded-full flex items-center justify-center text-xs border border-[#e6c888]/20 mt-0.5 font-mono">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed text-lg">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Core Logic */}
            <div className="custom-markdown">
              <h2 className="text-xl font-semibold text-[#e6c888] mb-4 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5" /> Core Logic & Approach
                <ProBadge />
              </h2>
              <MarkdownRenderer content={question.coreLogic} />
            </div>

            {/* Edge Cases */}
            {userSettings.showEdgeCases && question.edgeCases && (
              <div className="custom-markdown border-t border-gray-800/50 pt-8">
                <h2 className="text-xl font-semibold text-[#e6c888] mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> High Yield Edge Cases
                </h2>
                <MarkdownRenderer content={question.edgeCases} />
              </div>
            )}

            {/* Syntax Notes */}
            {userSettings.showSyntaxNotes && question.syntaxNotes && (
              <div className="custom-markdown border-t border-gray-800/50 pt-8">
                <h2 className="text-xl font-semibold text-[#e6c888] mb-4 flex items-center gap-2">
                  <Code2 className="w-5 h-5" /> Language Syntax to Remember
                </h2>
                <MarkdownRenderer content={question.syntaxNotes} />
              </div>
            )}
          </div>
        )}

        {/* CODE TAB */}
        {activeTab === "code" && (
          <div className="animate-in fade-in h-full">
            <div className="relative rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[#0c0c0c] rounded-bl-xl border-l border-b border-gray-800 text-xs text-gray-500 font-mono z-10 uppercase tracking-wider font-bold">
                {question.language}
              </div>
              <SyntaxHighlighter
                language={question.language.toLowerCase()}
                style={atomDark}
                wrapLongLines={true}
                showLineNumbers={true}
                customStyle={{
                  margin: 0,
                  padding: "2rem",
                  backgroundColor: "#0c0c0c",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                {question.code}
              </SyntaxHighlighter>
            </div>
          </div>
        )}

        {/* SUGGESTIONS TAB */}
        {activeTab === "suggestions" && (
          <div className="animate-in fade-in custom-markdown text-[#cccccc]">
            {!question.improvementMarkdown ||
            question.improvementMarkdown.length < 50 ||
            question.improvementMarkdown.toLowerCase().includes("no major improvements") ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-gray-800 rounded-2xl bg-gray-900/20">
                <div className="bg-yellow-500/10 p-4 rounded-full mb-6 ring-1 ring-yellow-500/20">
                  <Crown className="w-12 h-12 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Stellar Solution!
                </h3>
                <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                  Your code is already optimal. No major improvements needed. Keep
                  up the great work!
                </p>
              </div>
            ) : (
              <>
                <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-xl mb-8 flex items-start gap-4">
                  <Lightbulb className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-base text-blue-200/80 leading-relaxed">
                    This section contains suggested improvements and the final
                    polished code.
                  </p>
                </div>
                <MarkdownRenderer content={question.improvementMarkdown} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetail;
