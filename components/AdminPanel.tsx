import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Database,
  Trash2,
  RefreshCw,
  LogOut,
  FileText,
  CheckCircle,
  AlertCircle,
  Lock,
  ArrowLeft,
} from "lucide-react";

interface AdminPanelProps {
  onBack: () => void;
}

interface Stats {
  totalUsers: number;
  totalQuestions: number;
  cache: {
    memory: { size: number };
    mongo: { count: number };
    redis: { connected: boolean; keys?: number };
  };
  recentUsers: Array<{ email: string; createdAt: string }>;
}

interface User {
  id: string;
  email: string;
  createdAt: string;
  questionCount: number;
}

interface CachedSolution {
  _id: string;
  questionName: string;
  language: string;
  hitCount: number;
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [cachedSolutions, setCachedSolutions] = useState<CachedSolution[]>([]);
  const [cacheClearing, setCacheClearing] = useState(false);
  const [cacheMessage, setCacheMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Check for existing admin token
  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    if (token) {
      setIsAuthenticated(true);
      fetchStats(token);
      fetchUsers(token);
      fetchCachedSolutions(token);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        sessionStorage.setItem("adminToken", data.token);
        setIsAuthenticated(true);
        fetchStats(data.token);
        fetchUsers(data.token);
        fetchCachedSolutions(data.token);
      } else {
        setError(data.error || "Invalid password");
      }
    } catch (err) {
      setError("Connection error. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchUsers = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchCachedSolutions = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cached-solutions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCachedSolutions(data.solutions);
      }
    } catch (err) {
      console.error("Failed to fetch cached solutions:", err);
    }
  };

  const handleDeleteCachedSolution = async (id: string) => {
    const token = sessionStorage.getItem("adminToken");
    if (!token) return;

    setDeletingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cached-solutions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCachedSolutions(prev => prev.filter(s => s._id !== id));
        fetchStats(token);
      }
    } catch (err) {
      console.error("Failed to delete cached solution:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearCache = async () => {
    const token = sessionStorage.getItem("adminToken");
    if (!token) return;

    setCacheClearing(true);
    setCacheMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cache`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setCacheMessage("✅ All caches cleared successfully!");
        fetchStats(token);
      } else {
        setCacheMessage("❌ " + (data.error || "Failed to clear cache"));
      }
    } catch (err) {
      setCacheMessage("❌ Connection error");
    } finally {
      setCacheClearing(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    setStats(null);
    setUsers([]);
    setPassword("");
  };

  const handleRefresh = () => {
    const token = sessionStorage.getItem("adminToken");
    if (token) {
      fetchStats(token);
      fetchUsers(token);
      fetchCachedSolutions(token);
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </button>

          <div className="bg-[#111318] border border-gray-800 rounded-2xl p-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="bg-yellow-500/10 p-3 rounded-xl">
                <Shield className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-white mb-2">
              Admin Access
            </h1>
            <p className="text-gray-500 text-center mb-8">
              Enter admin password to continue
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin Password"
                  className="w-full pl-11 pr-4 py-3 bg-[#0b0f19] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Access Admin Panel
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-[#0b0f19] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500/10 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-yellow-500" />
              </div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111318] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400 text-sm">Total Users</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats?.totalUsers ?? "-"}
            </div>
          </div>

          <div className="bg-[#111318] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-green-400" />
              <span className="text-gray-400 text-sm">Total Questions</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats?.totalQuestions ?? "-"}
            </div>
          </div>

          <div className="bg-[#111318] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Database className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400 text-sm">Memory Cache</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats?.cache?.memory?.size ?? "-"}
            </div>
          </div>

          <div className="bg-[#111318] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Database className="w-5 h-5 text-orange-400" />
              <span className="text-gray-400 text-sm">MongoDB Cache</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats?.cache?.mongo?.count ?? "-"}
            </div>
          </div>

          <div className="bg-[#111318] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Database className="w-5 h-5 text-red-400" />
              <span className="text-gray-400 text-sm">Redis Cache</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats?.cache?.redis?.connected ? (stats?.cache?.redis?.keys ?? 0) : "N/A"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats?.cache?.redis?.connected ? "✓ Connected" : "✗ Not connected"}
            </div>
          </div>
        </div>

        {/* Cache Management */}
        <div className="bg-[#111318] border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            Cache Management
          </h2>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleClearCache}
              disabled={cacheClearing}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 rounded-lg font-medium text-white transition-colors"
            >
              {cacheClearing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Clear All Caches
            </button>
            
            {cacheMessage && (
              <span className={cacheMessage.includes("✅") ? "text-green-400" : "text-red-400"}>
                {cacheMessage}
              </span>
            )}
          </div>
          
          <p className="text-gray-500 text-sm mt-3">
            This will clear Redis, MongoDB, and in-memory caches.
          </p>
        </div>

        {/* Cached Solutions Table */}
        <div className="bg-[#111318] border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            Cached Solutions ({cachedSolutions.length})
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Question</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Language</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Hits</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Cached</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {cachedSolutions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No cached solutions found
                    </td>
                  </tr>
                ) : (
                  cachedSolutions.map((solution) => (
                    <tr key={solution._id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-3 px-4 text-white max-w-xs truncate">{solution.questionName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">
                          {solution.language}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-full text-sm">
                          {solution.hitCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {new Date(solution.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteCachedSolution(solution._id)}
                          disabled={deletingId === solution._id}
                          className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === solution._id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#111318] border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Registered Users ({users.length})
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Email</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Joined</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Questions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-3 px-4 text-white">{user.email}</td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm">
                          {user.questionCount}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
