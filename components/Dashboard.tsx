import React, { useMemo, useState } from "react";
import { SavedQuestion } from "../types";
import { FolderGit2, Calendar, ArrowRight, LayoutGrid, Search, ChevronDown, ChevronRight, Crown } from "lucide-react";
import ProBadge from "./ProBadge";

interface DashboardProps {
  questions: SavedQuestion[];
  onSelectQuestion: (question: SavedQuestion) => void;
  onAddNew: () => void;
  onShowPricing: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  questions,
  onSelectQuestion,
  onAddNew,
  onShowPricing,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Filter questions based on search
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const query = searchQuery.toLowerCase();
    return questions.filter(
      (q) =>
        q.title.toLowerCase().includes(query) ||
        q.pattern?.toLowerCase().includes(query) ||
        q.dsaCategory?.toLowerCase().includes(query) ||
        q.language?.toLowerCase().includes(query)
    );
  }, [questions, searchQuery]);

  // Group questions by DSA Category
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, SavedQuestion[]> = {};
    filteredQuestions.forEach((q) => {
      const cat = q.dsaCategory || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(q);
    });
    return groups;
  }, [filteredQuestions]);

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const collapseAll = () => {
    setCollapsedCategories(new Set(Object.keys(groupedQuestions)));
  };

  const expandAll = () => {
    setCollapsedCategories(new Set());
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="bg-gray-800/50 p-6 rounded-full">
          <LayoutGrid className="w-16 h-16 text-yellow-500/50" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Your Dashboard is Empty
          </h2>
          <p className="text-gray-400 mt-2 max-w-md text-sm sm:text-base px-4">
            Start adding your LeetCode solutions. We'll organize them by Data
            Structure and Pattern automatically.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full px-4 sm:w-auto">
          <button
            onClick={onAddNew}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-yellow-900/20"
          >
            Add First Solution
          </button>
          <button
            onClick={onShowPricing}
            className="group flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-sm font-semibold text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-400 transition-all shadow-sm shadow-yellow-900/30"
          >
            <Crown className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" />
            <span>Upgrade to Pro</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-yellow-500" />
              My Library
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {filteredQuestions.length} Questions •{" "}
              {Object.keys(groupedQuestions).length} Categories
              {searchQuery && ` • Searching "${searchQuery}"`}
            </p>
          </div>
          
          {/* Compact Pro Button - Mobile Only (inline with header) */}
          <button
            type="button"
            className="sm:hidden group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-xs font-semibold text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-400 transition-all shadow-sm shadow-yellow-900/30"
            onClick={onShowPricing}
          >
            <Crown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" />
            <span>Pro</span>
          </button>
        </div>
        
        {/* Search + Upgrade Button - Desktop */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search questions, patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
          
          {/* Full Upgrade Button - Desktop Only */}
          <button
            type="button"
            className="hidden sm:flex group items-center justify-center gap-2 px-4 py-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-sm font-semibold text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-400 transition-all shadow-sm shadow-yellow-900/30"
            onClick={onShowPricing}
          >
            <Crown className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" />
            <span>Upgrade</span>
          </button>
        </div>
      </div>

      {/* Expand/Collapse All */}
      {Object.keys(groupedQuestions).length > 1 && (
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-gray-400 hover:text-yellow-500 transition-colors"
          >
            Expand All
          </button>
          <span className="text-gray-600">•</span>
          <button
            onClick={collapseAll}
            className="text-xs text-gray-400 hover:text-yellow-500 transition-colors"
          >
            Collapse All
          </button>
        </div>
      )}

      {/* No Results */}
      {filteredQuestions.length === 0 && searchQuery && (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No questions found for "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-yellow-500 hover:text-yellow-400 mt-2 text-sm"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {(Object.entries(groupedQuestions) as [string, SavedQuestion[]][]).map(([category, items]) => {
          const isCollapsed = collapsedCategories.has(category);
          
          return (
            <div key={category} className="space-y-3">
              {/* Category Header - Clickable */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between gap-3 group"
              >
                <h3 className="text-lg font-semibold text-yellow-500 flex items-center gap-2 flex-wrap">
                  <FolderGit2 className="w-5 h-5 shrink-0" />
                  <span className="break-words">{category}</span>
                  <span className="text-xs font-normal text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-800 shrink-0">
                    {items.length}
                  </span>
                </h3>
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-yellow-500 transition-colors shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-yellow-500 transition-colors shrink-0" />
                )}
              </button>

              {/* Questions Grid - Collapsible */}
              {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  {items.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => onSelectQuestion(q)}
                      className="group bg-gray-900 border border-gray-800 hover:border-yellow-500/50 rounded-xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-yellow-900/10 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs font-medium text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 max-w-full break-words leading-tight">
                            {q.pattern}
                          </span>
                          {q.language && (
                            <span className="text-xs text-gray-500 font-mono shrink-0">
                              {q.language}
                            </span>
                          )}
                        </div>

                        <h4 className="font-semibold text-gray-100 group-hover:text-yellow-500 transition-colors line-clamp-1">
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
                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-yellow-500 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
