import React, { useEffect, useState } from "react";
import { Sparkles, FileText, Infinity } from "lucide-react";

interface Usage {
  getSolution: { used: number; limit: number; left: number };
  addSolution: { used: number; limit: number; left: number };
}

interface UsageDisplayProps {
  className?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const UsageDisplay: React.FC<UsageDisplayProps> = ({ className = "" }) => {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/usage`, { headers });
      const data = await response.json();
      
      if (data.success) {
        setUsage(data.usage);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Refresh on window focus
    const handleFocus = () => fetchUsage();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Listen for custom event to refresh usage immediately after API calls
  useEffect(() => {
    const handleUsageUpdate = () => {
      console.log("[UsageDisplay] Refreshing usage...");
      fetchUsage();
    };
    window.addEventListener("usage-updated", handleUsageUpdate);
    return () => window.removeEventListener("usage-updated", handleUsageUpdate);
  }, []);

  if (loading) {
    return (
      <div className={`bg-[#111318] border border-gray-700/60 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-gray-400 py-1">
          <div className="w-3 h-3 border border-gray-500 border-t-[#e6c888] rounded-full animate-spin" />
          <span className="text-[10px]">Loading...</span>
        </div>
      </div>
    );
  }

  if (!usage) return null;

  const getPercentage = (left: number, limit: number) => (left / limit) * 100;
  const getColor = (left: number, limit: number) => {
    const pct = getPercentage(left, limit);
    if (pct <= 0) return { bar: "bg-red-600/90", text: "text-red-400/90" };
    if (pct <= 33) return { bar: "bg-amber-500/90", text: "text-amber-400/90" };
    return { bar: "bg-[#e2b857]", text: "text-[#e2b857]" };
  };

  const getSolutionColors = getColor(usage.getSolution.left, usage.getSolution.limit);
  const addSolutionColors = getColor(usage.addSolution.left, usage.addSolution.limit);

  return (
    <div className={`bg-[#0d0e12] border border-gray-800/80 rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#e2b857]/80" />
          <span className="text-[10px] font-semibold text-gray-400 tracking-wide uppercase">Daily Usage</span>
        </div>
      </div>
      
      <div className="p-3 space-y-4">
        {/* Get Solution */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-400">Get Solution</span>
            </div>
            <div className={`text-xs font-bold ${getSolutionColors.text}`}>
              {usage.getSolution.left}<span className="text-gray-600 font-medium">/{usage.getSolution.limit}</span>
            </div>
          </div>
          
          <div className="h-1 bg-gray-800/40 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getSolutionColors.bar} rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(226,184,87,0.2)]`}
              style={{ width: `${getPercentage(usage.getSolution.left, usage.getSolution.limit)}%` }}
            />
          </div>
        </div>

        {/* Add Solution */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-400">Add Solution</span>
            </div>
            <div className={`text-xs font-bold ${addSolutionColors.text}`}>
              {usage.addSolution.left}<span className="text-gray-600 font-medium">/{usage.addSolution.limit}</span>
            </div>
          </div>
          
          <div className="h-1 bg-gray-800/40 rounded-full overflow-hidden">
            <div 
              className={`h-full ${addSolutionColors.bar} rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(226,184,87,0.2)]`}
              style={{ width: `${getPercentage(usage.addSolution.left, usage.addSolution.limit)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-gray-800/30 bg-black/10">
        <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-600">
          <Infinity className="w-2.5 h-2.5" />
          <span>Cache unlimited • Resets midnight</span>
        </div>
      </div>
    </div>
  );
};

export default UsageDisplay;
