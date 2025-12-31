import React, { useState } from 'react';
import { Download, FileText, File, ChevronDown, ChevronRight, Crown } from 'lucide-react';
import { exportAsMarkdown, exportAsPDF, exportAsText } from '../utils/exportUtils';

interface ExportDropdownProps {
  data: any; // Using any for brevity since we're passing through
  className?: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  isPro?: boolean;
  onUpgrade?: () => void;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({ 
  data, 
  className = '', 
  isOpen: controlledIsOpen, 
  onToggle,
  isPro = false,
  onUpgrade
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (onToggle) {
      onToggle(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  const exportOptions = [
    {
      label: 'PDF',
      action: () => {
        if (!isPro && onUpgrade) {
          onUpgrade();
          setIsOpen(false);
          return;
        }
        exportAsPDF(data);
        setIsOpen(false);
      },
      badge: 'Pro',
      isLocked: !isPro
    },
    {
      label: 'Markdown',
      action: () => {
        exportAsMarkdown(data);
        setIsOpen(false);
      },
    },
    {
      label: 'Text',
      action: () => {
        exportAsText(data);
        setIsOpen(false);
      },
    },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-white transition-colors"
        title="Export Notes"
      >
        <Download className="w-5 h-5" />
      </button>

      {/* Small Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-40 bg-[#141414] border border-gray-800 rounded-lg shadow-xl p-1 z-20">
            {exportOptions.map((option, idx) => (
              <button
                key={idx}
                onClick={option.action}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#cccccc] hover:bg-gray-800 rounded-md transition-colors"
              >
                <span>{option.label}</span>
                {option.badge && (
                  <Crown className="w-3.5 h-3.5 text-yellow-400" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ExportDropdown;
