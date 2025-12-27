import React from "react";
import { Crown } from "lucide-react";

interface ProBadgeProps {
  className?: string;
  size?: number;
}

/**
 * Pro Badge Component
 * Crown icon to mark premium features
 */
const ProBadge: React.FC<ProBadgeProps> = ({ className = "", size = 16 }) => {
  return (
    <Crown 
      className={`inline-block text-amber-400 ${className}`}
      size={size}
      style={{ 
        verticalAlign: 'middle',
        marginLeft: '6px'
      }}
      aria-label="Pro Feature"
    />
  );
};

export default ProBadge;
