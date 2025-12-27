import React, { useState, useEffect } from "react";
import { Mail, Lock, User, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import AppLogo from "../Logo-With-Name cropped.png";

// Google Icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// GitHub Icon
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

interface SignupProps {
  onSignup: (token: string, user: any) => void;
  onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup, onSwitchToLogin }) => {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;



  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      setStep("otp");
      setMessage(data.message || "OTP sent to your email");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");
      onSignup(data.token, data.user);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    if (!GOOGLE_CLIENT_ID) { setError("Google login not configured"); return; }
    setOauthLoading('google');
    setError("");
    try {
      if (!(window as any).google?.accounts?.oauth2) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Google'));
          document.head.appendChild(script);
        });
      }
      await new Promise(r => setTimeout(r, 100));
      (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: async (response: any) => {
          if (response.error) { setError(response.error); setOauthLoading(null); return; }
          try {
            const res = await fetch(`${API_BASE_URL}/api/auth/google/callback`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ access_token: response.access_token }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Google login failed");
            onSignup(data.token, data.user);
          } catch (err: any) { setError(err.message); }
          finally { setOauthLoading(null); }
        },
        error_callback: (error: any) => {
          // User cancelled or other error occurred
          console.log('[GOOGLE AUTH] User cancelled or error:', error);
          setOauthLoading(null);
        },
      }).requestAccessToken();
    } catch (err: any) { setError(err.message); setOauthLoading(null); }
  };

  const handleGitHubLogin = () => {
    if (!GITHUB_CLIENT_ID) { setError("GitHub login not configured"); return; }
    setOauthLoading('github');
    const redirectUri = `${window.location.origin}/api/auth/github/callback`;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('read:user user:email')}&state=github_oauth`;
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] px-4">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-sm bg-[#0f1420] border border-[#1f2937] rounded-2xl p-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <img src={AppLogo} alt="ReCode" className="h-10 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {step === "details" ? "Create Account" : "Verify Email"}
          </h2>
          <p className="text-[#6b7280] text-xs mt-1">
            {step === "details" ? "Start your revision journey" : `Code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-2.5 bg-[#e6c888]/10 border border-[#e6c888]/20 rounded-lg text-[#e6c888] text-xs text-center">
            {message}
          </div>
        )}

        {step === "details" ? (
          <>
            {/* OAuth - Side by Side */}
            <div className="flex gap-2 mb-5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={!!oauthLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium h-10 rounded-lg text-sm transition-all disabled:opacity-50"
              >
                {oauthLoading === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><GoogleIcon /> Google</>}
              </button>
              <button
                type="button"
                onClick={handleGitHubLogin}
                disabled={!!oauthLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-[#111318] hover:bg-[#1a1f2e] text-white font-medium h-10 rounded-lg text-sm transition-all disabled:opacity-50 border border-[#1f2937]"
              >
                {oauthLoading === 'github' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><GitHubIcon /> GitHub</>}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-[#0f1420] text-[#4b5563] text-[10px] uppercase tracking-wider">or</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${focusedInput === "username" ? "text-[#e6c888]" : "text-[#4b5563]"}`} />
                <input
                  type="text"
                  value={username}
                  onFocus={() => setFocusedInput("username")}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#1f2937] rounded-lg py-2.5 pl-9 pr-3 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#e6c888]/50 transition-all"
                  placeholder="Username"
                  required
                />
              </div>

              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${focusedInput === "email" ? "text-[#e6c888]" : "text-[#4b5563]"}`} />
                <input
                  type="email"
                  value={email}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#1f2937] rounded-lg py-2.5 pl-9 pr-3 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#e6c888]/50 transition-all"
                  placeholder="Email"
                  required
                />
              </div>

              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${focusedInput === "password" ? "text-[#e6c888]" : "text-[#4b5563]"}`} />
                <input
                  type="password"
                  value={password}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#1f2937] rounded-lg py-2.5 pl-9 pr-3 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#e6c888]/50 transition-all"
                  placeholder="Password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !!oauthLoading}
                className="w-full bg-[#CA8A04] hover:bg-[#EAB308] active:bg-[#A16207] text-white font-semibold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="relative">
              <KeyRound className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${focusedInput === "otp" ? "text-[#e6c888]" : "text-[#4b5563]"}`} />
              <input
                type="text"
                value={otp}
                onFocus={() => setFocusedInput("otp")}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#1f2937] rounded-lg py-3 pl-9 pr-3 text-lg text-white placeholder-[#4b5563] focus:outline-none focus:border-[#e6c888]/50 transition-all tracking-widest text-center"
                placeholder="123456"
                required
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#CA8A04] hover:bg-[#EAB308] active:bg-[#A16207] text-white font-semibold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify & Login <ArrowRight className="w-4 h-4" /></>}
            </button>

            <button
              type="button"
              onClick={() => { setStep("details"); setMessage(""); }}
              className="w-full text-xs text-[#6b7280] hover:text-white transition-colors"
            >
              ← Back
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="mt-5 text-center text-xs text-[#4b5563]">
          Already have an account?{" "}
          <button onClick={onSwitchToLogin} className="text-[#e6c888] hover:text-[#EAB308] font-medium">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
