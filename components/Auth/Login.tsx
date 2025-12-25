import React, { useState } from "react";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import AppLogo from "../Logo-With-Name cropped.png";

interface LoginProps {
  onLogin: (token: string, user: any) => void;
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
}

const Login: React.FC<LoginProps> = ({
  onLogin,
  onSwitchToSignup,
  onForgotPassword,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] px-4 relative overflow-hidden">
      {/* Optional Side Illustration / Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-[#0f1420] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.45)] relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-12 rounded-lg overflow-hidden">
              <img src={AppLogo} alt="ReCode" className="h-full w-auto object-contain" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400">
            Sign in to continue your revision journey
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email
            </label>
            <div className="relative group">
              <Mail
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                  focusedInput === "email"
                    ? "text-yellow-500 -translate-y-3/4"
                    : "text-gray-500"
                }`}
              />
              <input
                type="email"
                value={email}
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0b0f19] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-700 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all shadow-inner"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Password
            </label>
            <div className="relative group">
              <Lock
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                  focusedInput === "password"
                    ? "text-yellow-500 -translate-y-3/4"
                    : "text-gray-500"
                }`}
              />
              <input
                type="password"
                value={password}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b0f19] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-700 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all shadow-inner"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <ShieldCheck className="w-3 h-3 text-green-500/70" />
              <span>Your data is encrypted and secure.</span>
            </div>
          </div>

          <div className="text-right pt-1">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-gray-400 hover:text-white hover:underline transition-all"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98] focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In{" "}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToSignup}
            className="text-yellow-400 hover:text-yellow-300 font-medium hover:underline"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
