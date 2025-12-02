import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SavedQuestion, UserSettings } from '../types';
import { ArrowLeft, Clock, Zap, FileCode, Lightbulb, Trash2, Hash, Settings2, CheckSquare, Eye, TestTube2 } from 'lucide-react';

interface QuestionDetailProps {
  question: SavedQuestion;
  userSettings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
}

const QuestionDetail: React.FC<QuestionDetailProps> = ({ question, userSettings, onUpdateSettings, onBack, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'revise' | 'code' | 'suggestions'>('revise');
  const [showSettings, setShowSettings] = useState(false);

  // Helper to render markdown with syntax highlighting
  const MarkdownRenderer = ({ content }: { content: string }) => (
    <ReactMarkdown
      components={{
        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-emerald-300 mt-6 mb-3 border-b border-gray-800 pb-2" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-lg font-medium text-white mt-4 mb-2" {...props} />,
        p: ({node, ...props}) => <p className="text-gray-300 mb-4 leading-relaxed" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4 text-gray-300 space-y-1" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-4 text-gray-300 space-y-1" {...props} />,
        strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
        code({node, className, children, ...props}) {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match && !String(children).includes('\n');
          
          if (isInline) {
            return (
              <code className="bg-gray-800 text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          }

          return (
            <div className="my-4 rounded-lg overflow-hidden border border-gray-800">
               <SyntaxHighlighter
                children={String(children).replace(/\n$/, '')}
                style={atomDark}
                language={match ? match[1] : 'text'}
                PreTag="div"
                wrapLongLines={true}
                customStyle={{ margin: 0, padding: '1rem', backgroundColor: '#0b0f19' }}
                {...props}
              />
            </div>
          );
        }
      }}
    >
      {content || ''}
    </ReactMarkdown>
  );

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-right-4">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white">{question.title}</h1>
          <div className="flex gap-3 mt-3">
             <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
          {activeTab === 'revise' && (
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-800 hover:text-white'}`}
                title="View Options"
              >
                <Settings2 className="w-5 h-5" />
              </button>
              
              {showSettings && (
                <div className="absolute right-0 top-12 w-64 bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-3 z-50">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2 px-1">View Options</div>
                  
                  <button 
                    onClick={() => onUpdateSettings({...userSettings, showTestCases: !userSettings.showTestCases})}
                    className="flex items-center gap-3 w-full p-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors"
                  >
                     <div className={`w-4 h-4 rounded border flex items-center justify-center ${userSettings.showTestCases ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'}`}>
                      {userSettings.showTestCases && <CheckSquare className="w-3 h-3 text-white" />}
                    </div>
                    Show Test Cases
                  </button>

                  <button 
                    onClick={() => onUpdateSettings({...userSettings, showVisualization: !userSettings.showVisualization})}
                    className="flex items-center gap-3 w-full p-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors"
                  >
                     <div className={`w-4 h-4 rounded border flex items-center justify-center ${userSettings.showVisualization ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'}`}>
                      {userSettings.showVisualization && <CheckSquare className="w-3 h-3 text-white" />}
                    </div>
                    Show Visualization
                  </button>

                  <div className="h-px bg-gray-800 my-2"></div>

                  <button 
                    onClick={() => onUpdateSettings({...userSettings, showEdgeCases: !userSettings.showEdgeCases})}
                    className="flex items-center gap-3 w-full p-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${userSettings.showEdgeCases ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'}`}>
                      {userSettings.showEdgeCases && <CheckSquare className="w-3 h-3 text-white" />}
                    </div>
                    Show Edge Cases
                  </button>
                  <button 
                    onClick={() => onUpdateSettings({...userSettings, showSyntaxNotes: !userSettings.showSyntaxNotes})}
                    className="flex items-center gap-3 w-full p-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors"
                  >
                     <div className={`w-4 h-4 rounded border flex items-center justify-center ${userSettings.showSyntaxNotes ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'}`}>
                      {userSettings.showSyntaxNotes && <CheckSquare className="w-3 h-3 text-white" />}
                    </div>
                    Show Syntax Notes
                  </button>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={() => {
              if(confirm('Are you sure you want to delete this question?')) onDelete(question.id);
            }}
            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete Question"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab('revise')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'revise' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" /> Quick Revise
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'code' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" /> My Code
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'suggestions' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Lightbulb className="w-4 h-4" /> AI Suggestions
        </button>
      </div>

      {/* Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 md:p-8 min-h-[500px] relative">
        
        {/* REVISION TAB */}
        {activeTab === 'revise' && (
          <div className="space-y-8 animate-in fade-in">
            {/* 1. Problem Overview */}
            <div className="custom-markdown bg-gray-950/50 p-6 rounded-lg border border-gray-800/50">
              <h2 className="text-xl font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                Problem Overview
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">{question.problemOverview}</p>
              
              {/* Test Cases (Now comes BEFORE visualization) */}
              {userSettings.showTestCases && question.testCases && (
                 <div className="mt-6 pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-300 mb-2 uppercase tracking-wide">
                        <TestTube2 className="w-4 h-4" /> Test Cases
                    </div>
                    <MarkdownRenderer content={question.testCases} />
                 </div>
              )}

              {/* Visualization (ASCII Diagram) */}
              {userSettings.showVisualization && question.visualization && (
                 <div className="mt-6 pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-300 mb-2 uppercase tracking-wide">
                       <Eye className="w-4 h-4" /> Visual Representation
                    </div>
                    <div className="font-mono text-xs md:text-sm bg-[#0b0f19] text-emerald-100 p-4 rounded-md border border-gray-800 overflow-x-auto whitespace-pre leading-snug">
                       {question.visualization}
                    </div>
                 </div>
              )}
            </div>

            {/* Complexity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-950/50 border border-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">
                  <Clock className="w-3 h-3" /> Time Complexity
                </div>
                <div className="text-white font-mono">{question.timeComplexity}</div>
              </div>
              <div className="bg-gray-950/50 border border-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">
                  <Hash className="w-3 h-3" /> Space Complexity
                </div>
                <div className="text-white font-mono">{question.spaceComplexity}</div>
              </div>
            </div>

            {/* Checklist */}
            {question.revisionNotes && question.revisionNotes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Fast Recall Checklist</h3>
                <ul className="space-y-3">
                  {question.revisionNotes.map((note, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-300">
                      <span className="flex-shrink-0 w-5 h-5 bg-emerald-900/30 text-emerald-400 rounded-full flex items-center justify-center text-xs border border-emerald-900/50 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Core Logic (Pattern, Approach) */}
            <div className="custom-markdown">
              <MarkdownRenderer content={question.coreLogic} />
            </div>

            {/* Optional: Edge Cases */}
            {userSettings.showEdgeCases && question.edgeCases && (
               <div className="custom-markdown border-t border-gray-800 pt-6">
                 <h2 className="text-xl font-semibold text-emerald-300 mb-3">High Yield Edge Cases</h2>
                 <MarkdownRenderer content={question.edgeCases} />
               </div>
            )}

            {/* Optional: Syntax Notes */}
            {userSettings.showSyntaxNotes && question.syntaxNotes && (
               <div className="custom-markdown border-t border-gray-800 pt-6">
                  <h2 className="text-xl font-semibold text-emerald-300 mb-3">Language Syntax to Remember</h2>
                 <MarkdownRenderer content={question.syntaxNotes} />
               </div>
            )}
          </div>
        )}

        {/* CODE TAB */}
        {activeTab === 'code' && (
          <div className="animate-in fade-in h-full">
            <div className="relative rounded-lg overflow-hidden border border-gray-800">
               <div className="absolute top-0 right-0 p-2 bg-gray-900/80 rounded-bl-lg border-l border-b border-gray-800 text-xs text-gray-500 font-mono z-10">
                  {question.language}
               </div>
               <SyntaxHighlighter
                language={question.language.toLowerCase()}
                style={atomDark}
                wrapLongLines={true}
                customStyle={{ margin: 0, padding: '1.5rem', backgroundColor: '#0b0f19', fontSize: '0.875rem' }}
              >
                {question.code}
              </SyntaxHighlighter>
            </div>
          </div>
        )}

        {/* SUGGESTIONS TAB (Polished only) */}
        {activeTab === 'suggestions' && (
          <div className="animate-in fade-in custom-markdown text-gray-300">
             <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg mb-6 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-200">
                  This section contains suggested improvements and the final polished code.
                </p>
             </div>
             <MarkdownRenderer content={question.improvementMarkdown} />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetail;