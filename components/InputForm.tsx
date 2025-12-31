import React, { useState } from 'react';
import { SubmissionData } from '../types';
import { Loader2, Code2, Sparkles } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: SubmissionData) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<SubmissionData>({
    problemUrl: '',
    code: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code) return;
    onSubmit(formData);
  };

  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-gray-800 bg-gray-850/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Code2 className="text-yellow-500 w-5 h-5" />
          Submission Details
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        
        {/* URL */}
        <div>
          <label htmlFor="problemUrl" className="block text-sm font-medium text-gray-300 mb-1">
            Problem URL <span className="text-gray-500 text-xs font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            id="problemUrl"
            name="problemUrl"
            value={formData.problemUrl}
            onChange={handleChange}
            placeholder="https://leetcode.com/problems/..."
            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
          />
          <p className="text-xs text-gray-500 mt-1">
            Note: Providing an accurate URL or problem name helps the AI analyze complexity correctly.
          </p>
        </div>

        {/* Code Editor Area */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-1">
            Your Code <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              id="code"
              name="code"
              required
              value={formData.code}
              onChange={handleChange}
              placeholder="// Paste your solution here. We will detect the language and problem title automatically."
              className="w-full h-64 bg-gray-950 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-200 placeholder-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all resize-none"
              spellCheck="false"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !formData.code}
          className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
            isLoading || !formData.code
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Code...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analyze & Save
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm;
