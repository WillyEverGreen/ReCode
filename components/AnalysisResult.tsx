import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, BookOpen, RotateCcw } from 'lucide-react';

interface AnalysisResultProps {
  markdown: string;
  onReset: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ markdown, onReset }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 bg-gray-850 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-white font-semibold">
            <BookOpen className="text-emerald-400" />
            <span>Revision Notes</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy MD'}
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              New Analysis
            </button>
          </div>
        </div>

        {/* Markdown Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-markdown">
           <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-emerald-400 mt-8 mb-4 border-b border-gray-800 pb-2" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-emerald-300 mt-6 mb-3" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-medium text-white mt-4 mb-2" {...props} />,
              p: ({node, ...props}) => <p className="text-gray-300 mb-4 leading-relaxed" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 mb-4 text-gray-300 space-y-1" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 mb-4 text-gray-300 space-y-1" {...props} />,
              li: ({node, ...props}) => <li className="pl-1" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
              code: ({node, className, children, ...props}) => {
                const match = /language-(\w+)/.exec(className || '')
                const isInline = !match && !String(children).includes('\n');
                return isInline ? (
                  <code className="bg-gray-800 text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                ) : (
                  <div className="relative my-4 rounded-lg overflow-hidden bg-gray-950 border border-gray-800">
                     <div className="absolute top-2 right-2 text-xs text-gray-500 uppercase">
                        {match ? match[1] : 'code'}
                     </div>
                    <code className="block p-4 overflow-x-auto font-mono text-sm text-gray-200" {...props}>
                      {children}
                    </code>
                  </div>
                )
              },
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-emerald-600 pl-4 italic text-gray-400 my-4" {...props} />
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;