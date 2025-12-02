import React, { useMemo } from 'react';
import { SavedQuestion } from '../types';
import { FolderGit2, Calendar, ArrowRight, LayoutGrid } from 'lucide-react';

interface DashboardProps {
  questions: SavedQuestion[];
  onSelectQuestion: (question: SavedQuestion) => void;
  onAddNew: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ questions, onSelectQuestion, onAddNew }) => {
  
  // Group questions by DSA Category
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, SavedQuestion[]> = {};
    questions.forEach(q => {
      const cat = q.dsaCategory || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(q);
    });
    return groups;
  }, [questions]);

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="bg-gray-800/50 p-6 rounded-full">
          <LayoutGrid className="w-16 h-16 text-emerald-500/50" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Your Dashboard is Empty</h2>
          <p className="text-gray-400 mt-2 max-w-md">
            Start adding your LeetCode solutions. We'll organize them by Data Structure and Pattern automatically.
          </p>
        </div>
        <button 
          onClick={onAddNew}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-emerald-900/20"
        >
          Add First Solution
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-end border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">My Library</h2>
          <p className="text-gray-400 text-sm mt-1">
            {questions.length} Questions • {Object.keys(groupedQuestions).length} Categories
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {Object.entries(groupedQuestions).map(([category, items]) => (
          <div key={category} className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
              <FolderGit2 className="w-5 h-5" />
              {category}
              <span className="text-xs font-normal text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-800">
                {items.length}
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(q => (
                <div 
                  key={q.id}
                  onClick={() => onSelectQuestion(q)}
                  className="group bg-gray-900 border border-gray-800 hover:border-emerald-500/50 rounded-xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-emerald-900/10 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-medium text-emerald-300 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/30">
                        {q.pattern}
                      </span>
                      {q.language && (
                        <span className="text-xs text-gray-500 font-mono">
                          {q.language}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-semibold text-gray-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {q.title}
                    </h4>
                    
                    <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                      {q.problemOverview}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(q.timestamp).toLocaleDateString()}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;