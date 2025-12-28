import React, { useState } from "react";
import { Crown, Sparkles, Check, ArrowRight, Zap } from "lucide-react";

const Pricing: React.FC = () => {
  const [notice, setNotice] = useState<string | null>(null);
  const features = {
    free: [
      "Daily limits on Get Solution and Add Solution",
      "Core AI-powered analysis and notes",
      "Dashboard with search and filtering",
      "Works with all common DSA languages",
    ],
    pro: [
      "Higher daily limits across all tools",
      "Faster access to new features and improvements",
      "Priority handling for feedback and support",
      "Best experience for focused interview prep",
      "Smart Code Analysis powered by our TC/SC engine",
      "Pattern Recognition and pattern-based question grouping",
      "AI Revision Notes panel with export and copy actions",
      "Fast Recall Checklist and Core Logic & Approach views",
      "Dedicated AI Suggestions tab with polished-code improvements",
      "Interview-style focused revision experience",
    ],
  };

  return (
        <div className="w-full text-gray-100">
      {/* No extra header copy for now */}

      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-2 mb-10 max-w-4xl mx-auto">
        {/* Free */}
        <div className="rounded-2xl border border-gray-800 bg-[#0f1117] p-6 flex flex-col justify-between shadow-md shadow-black/20">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900/80 border border-gray-700 text-xs font-semibold text-gray-300 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Free plan
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">Stay in control</h2>
            <p className="text-xs text-gray-400 mb-4">
              Ideal while you are exploring the app and building a small personal library.
            </p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold text-white">$0</span>
              <span className="text-gray-500 text-xs">forever</span>
            </div>

            <ul className="space-y-2 text-sm">
              {features.free.map((item) => (
                <li key={item} className="flex items-start gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pro */}
        <div className="relative rounded-2xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-500/15 via-transparent to-transparent p-6 flex flex-col justify-between shadow-xl shadow-yellow-900/30 transform md:scale-[1.02]">
          <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-[10px] font-semibold text-black uppercase tracking-wide shadow-lg">
            Most focused
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/40 text-xs font-semibold text-yellow-300 mb-3">
              <Crown className="w-3.5 h-3.5 text-yellow-300" />
              Pro plan
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">When interviews get serious</h2>
            <p className="text-xs text-yellow-100/80 mb-4">
              Designed for intensive prep cycles, with more room for daily problem solving.
            </p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold text-white">₹249</span>
              <span className="text-gray-400 text-xs">/month</span>
            </div>

            <ul className="space-y-2 text-sm mb-4">
              {features.pro.map((item) => (
                <li key={item} className="flex items-start gap-2 text-gray-100">
                  <Check className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="mt-2 inline-flex items-center justify-center gap-2 w-full rounded-xl bg-yellow-600 hover:bg-yellow-500 text-black font-semibold text-sm py-3 transition-all shadow-lg shadow-yellow-900/30 hover:shadow-yellow-900/50"
            onClick={() =>
              setNotice(
                "Pro is coming soon. For now, all Pro features are unlocked on your account."
              )
            }
          >
            Upgrade to Pro
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {notice && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-[11px] text-yellow-100/90">
            {notice}
          </div>
        )}

        {/* Small note */}
        <p className="text-[11px] text-gray-500 leading-relaxed">
          You can stay on the Free plan as long as you like. When you upgrade to Pro, your
          existing questions, notes, and progress remain exactly where they are — you just
          get more room to practice each day.
        </p>
      </div>
    </div>
  );
};

export default Pricing;
