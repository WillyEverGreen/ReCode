import React, { useState, useEffect } from "react";
import InputForm from "./components/InputForm";
import Dashboard from "./components/Dashboard";
import QuestionDetail from "./components/QuestionDetail";
import LandingPage from "./components/LandingPage";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import ForgotPassword from "./components/Auth/ForgotPassword";
import GetSolution from "./components/GetSolution";
import AdminPanel from "./components/AdminPanel";

import { API_BASE_URL } from "./config/api";
import {
  SubmissionData,
  SavedQuestion,
  ViewState,
  UserSettings,
} from "./types";
import { analyzeSubmission } from "./services/aiService";
import {
  LayoutDashboard,
  PlusCircle,
  AlertCircle,
  LogOut,
  Sparkles,
} from "lucide-react";
import AppLogo from "./components/Logo-With-Name cropped.png";

const App: React.FC = () => {
  // --- State ---
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<any>(null);
  const [authView, setAuthView] = useState<
    "login" | "signup" | "forgot-password"
  >("login");

  const [showLanding, setShowLanding] = useState<boolean>(!token);
  const [showAdmin, setShowAdmin] = useState<boolean>(false);

  // Check for admin route on mount and hash change
  useEffect(() => {
    const checkAdminRoute = () => {
      setShowAdmin(window.location.hash === "#admin");
    };
    checkAdminRoute();
    window.addEventListener("hashchange", checkAdminRoute);
    return () => window.removeEventListener("hashchange", checkAdminRoute);
  }, []);

  const [questions, setQuestions] = useState<SavedQuestion[]>([]);

  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem("leetcode-revision-settings");
    const defaults = {
      showEdgeCases: true,
      showSyntaxNotes: true,
      showTestCases: true,
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const [view, setView] = useState<ViewState>("dashboard");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Effects ---
  useEffect(() => {
    if (token) {
      fetchQuestions();
      setShowLanding(false);
    } else {
      setShowLanding(true);
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem(
      "leetcode-revision-settings",
      JSON.stringify(userSettings)
    );
  }, [userSettings]);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/questions`, {
        headers: { "x-auth-token": token! },
      });
      const data = await res.json();
      if (res.ok) {
        // Map _id to id
        const mappedQuestions = data.map((q: any) => ({ ...q, id: q._id }));
        setQuestions(mappedQuestions);
      }
    } catch (err) {
      console.error("Failed to fetch questions", err);
    }
  };

  // --- Handlers ---
  const handleLogin = (newToken: string, newUser: any) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setQuestions([]);
    setShowLanding(true);
  };

  const handleAddNew = async (data: SubmissionData) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeSubmission(data);

      const newQuestionData = {
        ...data,
        ...analysis,
        title: analysis.title || "Untitled Problem",
        language: analysis.language || "Unknown Language",
      };

      // Save to DB
      const res = await fetch(`${API_BASE_URL}/api/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token!,
        },
        body: JSON.stringify(newQuestionData),
      });

      const savedQuestion = await res.json();

      if (!res.ok) throw new Error(savedQuestion.message || "Failed to save");

      setQuestions((prev) => [
        { ...savedQuestion, id: savedQuestion._id },
        ...prev,
      ]);
      setSelectedQuestionId(savedQuestion._id);
      setView("detail");
    } catch (err: any) {
      setError(err.message || "Failed to analyze submission");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetStarted = () => {
    setShowLanding(false);
    // If not logged in, show login
    if (!token) {
      setAuthView("login");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/questions/${id}`, {
        method: "DELETE",
        headers: { "x-auth-token": token! },
      });

      setQuestions((prev) => prev.filter((q) => q.id !== id));
      if (selectedQuestionId === id) {
        setSelectedQuestionId(null);
        setView("dashboard");
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleUpdateQuestion = (updatedQuestion: SavedQuestion) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
    );
  };

  const renderContent = () => {
    // Admin panel (accessible without auth via hash route)
    if (showAdmin) {
      return (
        <AdminPanel
          onBack={() => {
            window.location.hash = "";
            setShowAdmin(false);
          }}
        />
      );
    }

    if (showLanding && !token) {
      return <LandingPage onGetStarted={handleGetStarted} />;
    }

    if (!token) {
      if (authView === "login") {
        return (
          <Login
            onLogin={handleLogin}
            onSwitchToSignup={() => setAuthView("signup")}
            onForgotPassword={() => setAuthView("forgot-password")}
          />
        );
      } else if (authView === "signup") {
        return (
          <Signup
            onSignup={handleLogin}
            onSwitchToLogin={() => setAuthView("login")}
          />
        );
      } else if (authView === "forgot-password") {
        return (
          <ForgotPassword
            onBack={() => setAuthView("login")}
            onLogin={() => setAuthView("login")}
          />
        );
      }
    }

    if (view === "add") {
      return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Add New Solution</h2>
            <p className="text-gray-400">
              Paste your code. We will auto-detect the problem and extract
              patterns.
            </p>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg text-red-200 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
          <InputForm onSubmit={handleAddNew} isLoading={isAnalyzing} />
        </div>
      );
    }

    if (view === "detail" && selectedQuestionId) {
      const question = questions.find((q) => q.id === selectedQuestionId);
      if (!question) return <div>Question not found</div>;

      return (
        <QuestionDetail
          question={question}
          userSettings={userSettings}
          onUpdateSettings={setUserSettings}
          onBack={() => setView("dashboard")}
          onDelete={handleDelete}
          onUpdateQuestion={handleUpdateQuestion}
        />
      );
    }

    if (view === "solution") {
      return <GetSolution />;
    }

    return (
      <Dashboard
        questions={questions}
        onSelectQuestion={(q) => {
          setSelectedQuestionId(q.id);
          setView("detail");
        }}
        onAddNew={() => setView("add")}
      />
    );
  };

  return (
    <div className="flex h-screen bg-[#0c0c0c] text-gray-100 font-sans overflow-hidden">
      {showAdmin ? (
        <div className="w-full h-full overflow-y-auto">
          <AdminPanel
            onBack={() => {
              window.location.hash = "";
              setShowAdmin(false);
            }}
          />
        </div>
      ) : (!token && showLanding) || !token ? (
        <div className="w-full h-full overflow-y-auto">{renderContent()}</div>
      ) : (
        <>
          {/* Sidebar */}
          <aside className="w-64 bg-[#0e0e0e] border-r border-gray-800 flex flex-col hidden md:flex shrink-0">
            <div className="p-6 border-b border-gray-800 flex items-center gap-3">
              <div className="h-10 rounded-lg overflow-hidden">
                <img src={AppLogo} alt="ReCode" className="h-full w-auto object-contain" />
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              <button
                onClick={() => setView("dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium tracking-wide ${
                  view === "dashboard" || view === "detail"
                    ? "bg-yellow-500/10 text-yellow-400 border-l-2 border-yellow-500"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white hover:pl-5"
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </button>

              <button
                onClick={() => setView("add")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium tracking-wide ${
                  view === "add"
                    ? "bg-yellow-500/10 text-yellow-400 border-l-2 border-yellow-500"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white hover:pl-5"
                }`}
              >
                <PlusCircle className="w-5 h-5" />
                Add Solution
              </button>

              <button
                onClick={() => setView("solution")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium tracking-wide ${
                  view === "solution"
                    ? "bg-yellow-500/10 text-yellow-400 border-l-2 border-yellow-500"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white hover:pl-5"
                }`}
              >
                <Sparkles className="w-5 h-5" />
                Get Solution
              </button>

            </nav>

            <div className="p-6 border-t border-gray-800">
              <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 mb-4">
                <div className="text-xs text-gray-500 mb-1">
                  Total Questions
                </div>
                <div className="text-2xl font-bold text-white">
                  {questions.length}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium text-red-400 hover:bg-red-900/20"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto relative">
            {/* Mobile Header */}
            <div className="md:hidden p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#0b0f19]/90 backdrop-blur-md z-20">
              <div className="h-8 rounded-lg overflow-hidden">
                <img src={AppLogo} alt="ReCode" className="h-full w-auto object-contain" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setView("dashboard")}
                  className={`p-2 rounded-md ${view === "dashboard" ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-800"}`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setView("add")}
                  className={`p-2 rounded-md ${view === "add" ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-800"}`}
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setView("solution")}
                  className={`p-2 rounded-md ${view === "solution" ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-800"}`}
                >
                  <Sparkles className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md bg-gray-800 text-red-400 hover:bg-red-900/30"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 md:py-12">
              {renderContent()}
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default App;
