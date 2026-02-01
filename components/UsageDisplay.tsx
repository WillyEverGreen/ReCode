import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  FileText,
  Infinity as InfinityIcon,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import ProBadge from './ProBadge';
// UpgradeModal removed - now redirects to pricing page

interface Usage {
  getSolution: { used: number; limit: number; left: number | string };
  addSolution: { used: number; limit: number; left: number | string };
  plan?: string;
  unlimited?: boolean;
}

interface UsageDisplayProps {
  className?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const UsageDisplay: React.FC<UsageDisplayProps> = ({ className = '' }) => {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  // Navigation to pricing page handled via custom event

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/usage`, { headers });
      const data = await response.json();

      if (data.success) {
        setUsage({ ...data.usage, plan: data.plan, unlimited: data.unlimited });
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
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
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Listen for custom event to refresh usage immediately after API calls
  useEffect(() => {
    const handleUsageUpdate = () => {
      console.log('[UsageDisplay] Refreshing usage...');
      fetchUsage();
    };
    window.addEventListener('usage-updated', handleUsageUpdate);
    return () => window.removeEventListener('usage-updated', handleUsageUpdate);
  }, []);

  if (loading) {
    return (
      <div
        className={`bg-[#111318] border border-gray-700/60 rounded-lg p-3 ${className}`}
      >
        <div className="flex items-center justify-center gap-2 text-gray-400 py-1">
          <div className="w-3 h-3 border border-gray-500 border-t-[#e6c888] rounded-full animate-spin" />
          <span className="text-[10px]">Loading...</span>
        </div>
      </div>
    );
  }

  if (!usage) return null;

  const getPercentage = (left: number | string, limit: number) => {
    if (left === 'unlimited') return 100;
    return ((left as number) / limit) * 100;
  };

  const getColor = (left: number | string, limit: number) => {
    if (left === 'unlimited')
      return { bar: 'bg-[#e2b857]', text: 'text-[#e2b857]' };
    const pct = getPercentage(left, limit);
    if (pct <= 0) return { bar: 'bg-red-600/90', text: 'text-red-400/90' };
    if (pct <= 33) return { bar: 'bg-amber-500/90', text: 'text-amber-400/90' };
    return { bar: 'bg-[#e2b857]', text: 'text-[#e2b857]' };
  };

  const getSolutionColors = getColor(
    usage.getSolution.left,
    usage.getSolution.limit
  );
  const addSolutionColors = getColor(
    usage.addSolution.left,
    usage.addSolution.limit
  );

  return (
    <div
      className={`bg-[#0d0e12] border border-gray-800/80 rounded-lg ${className}`}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-800/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#e2b857]/80" />
            <span className="text-[10px] font-semibold text-gray-400 tracking-wide uppercase">
              Daily Usage
            </span>
          </div>
          <div className="flex items-center gap-1">
            {usage.unlimited ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/40 text-[9px] font-semibold text-purple-300 uppercase tracking-wide">
                <ShieldCheck className="w-3 h-3" />
                Admin
              </span>
            ) : usage.plan === 'pro' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/40 text-[9px] font-semibold text-yellow-300 uppercase tracking-wide">
                <ProBadge size={12} />
                Pro
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-900 border border-gray-700 text-[9px] font-semibold text-gray-300 uppercase tracking-wide">
                Free
              </span>
            )}
          </div>
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
              {usage.getSolution.left === 'unlimited' ? (
                <span className="flex items-center gap-1 text-[#e2b857]">
                  <InfinityIcon className="w-3 h-3" />
                  Unlimited
                </span>
              ) : (
                <>
                  {usage.getSolution.left}
                  <span className="text-gray-600 font-medium">
                    /{usage.getSolution.limit}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="h-1 bg-gray-800/40 rounded-full overflow-hidden">
            <div
              className={`h-full ${getSolutionColors.bar} rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(226,184,87,0.2)]`}
              style={{
                width: `${getPercentage(usage.getSolution.left, usage.getSolution.limit)}%`,
              }}
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
              {usage.addSolution.left === 'unlimited' ? (
                <span className="flex items-center gap-1 text-[#e2b857]">
                  <InfinityIcon className="w-3 h-3" />
                  Unlimited
                </span>
              ) : (
                <>
                  {usage.addSolution.left}
                  <span className="text-gray-600 font-medium">
                    /{usage.addSolution.limit}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="h-1 bg-gray-800/40 rounded-full overflow-hidden">
            <div
              className={`h-full ${addSolutionColors.bar} rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(226,184,87,0.2)]`}
              style={{
                width: `${getPercentage(usage.addSolution.left, usage.addSolution.limit)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-800/30 bg-black/10 flex flex-col gap-2">
        {usage.plan === 'trial' && !usage.unlimited && (
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent('navigate-to-pricing'))
            }
            className="group flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-[11px] font-semibold text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-400 transition-all shadow-sm shadow-yellow-900/30 w-full"
          >
            <span className="relative flex items-center justify-center">
              <Crown className="w-4 h-4 text-yellow-400 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" />
            </span>
            <span>Upgrade</span>
          </button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-600">
          <InfinityIcon className="w-2.5 h-2.5" />
          <span>
            {usage.unlimited
              ? 'Unlimited access'
              : usage.plan === 'trial'
                ? 'Usage resets daily for a week'
                : 'Usage resets daily'}
          </span>
        </div>
      </div>

      {/* Upgrade handled via pricing page */}
    </div>
  );
};

export default UsageDisplay;
