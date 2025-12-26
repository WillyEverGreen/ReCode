import React from "react";

interface ProBadgeProps {
  unlocked?: boolean;
  className?: string;
  showLabel?: boolean;
}

/**
 * Pro Badge Component
 * Shows 🔓 (unlocked) during trial period, 🔒 (locked) after
 * Used to mark premium features throughout the app
 */
const ProBadge: React.FC<ProBadgeProps> = ({ 
  unlocked = true, 
  className = "",
  showLabel = true 
}) => {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="text-amber-400 text-xs">
        {unlocked ? "🔓" : "🔒"}
      </span>
      {showLabel && (
        <span className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 
                        text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-semibold
                        border border-amber-500/30 uppercase tracking-wide">
          Pro
        </span>
      )}
    </span>
  );
};

export default ProBadge;
