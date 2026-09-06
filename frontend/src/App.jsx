import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import jsPDF from "jspdf";

const API_URL = "http://127.0.0.1:8000";

function App() {
  // =========================================================
  // AUTH
  // =========================================================

  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );

  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authMessageType, setAuthMessageType] = useState("info");

  // =========================================================
  // CODE REVIEW
  // =========================================================

  const [code, setCode] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("python");
  const [history, setHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
const [historyLanguage, setHistoryLanguage] = useState("all");
const [historyLoading, setHistoryLoading] = useState(false);
  const [rating, setRating] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =========================================================
  // DASHBOARD STATS
  // =========================================================

  const totalReviews = history.length;

  const validScores = history
    .map((item) => Number(item.score))
    .filter(
      (score) =>
        !Number.isNaN(score) &&
        Number.isFinite(score)
    );

  const averageScore =
    validScores.length > 0
      ? (
          validScores.reduce(
            (sum, score) => sum + score,
            0
          ) / validScores.length
        ).toFixed(1)
      : "";

  const languagesUsed = new Set(
    history
      .map((item) => item.language)
      .filter(Boolean)
  ).size;

  const todaysReviews = history.filter((item) => {
    if (!item.created_at) return false;

    return (
      new Date(item.created_at).toDateString() ===
      new Date().toDateString()
    );
  }).length;

  // =========================================================
  // CLEAR MESSAGES
  // =========================================================

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  // =========================================================
  // AUTH ERROR HANDLER
  // =========================================================

  const handleUnauthorized = () => {
    localStorage.removeItem("access_token");

    setToken(null);
    setHistory([]);
    setReview("");
    setCode("");
    setRating("");

    setAuthMode("login");
    setAuthMessage(
      "Your session has expired. Please login again."
    );
    setAuthMessageType("error");
  };

  // =========================================================
  // LOAD HISTORY
  // =========================================================
const loadHistory = async () => {
  if (!token) return;

  setHistoryLoading(true);

  try {
    const response = await fetch(
      `${API_URL}/history`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      handleUnauthorized();
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("History error:", data);
      return;
    }

    setHistory(
      Array.isArray(data.history)
        ? data.history
        : []
    );

  } catch (error) {
    console.error(
      "Unable to load history:",
      error
    );

  } finally {
    setHistoryLoading(false);
  }
};
  

  // =========================================================
  // DELETE REVIEW
  // =========================================================

  const deleteReview = async (id) => {
    if (!id || !token) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) return;

    clearMessages();

    try {
      const response = await fetch(
        `${API_URL}/history/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.detail ||
            data.error ||
            "Unable to delete review."
        );
        return;
      }

      setCode("");
      setReview("");
      setRating("");

      setSuccessMessage(
        "Review deleted successfully."
      );

      await loadHistory();
    } catch (error) {
      console.error("Delete error:", error);

      setErrorMessage(
        "Unable to connect to server."
      );
    }
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const login = async (e) => {
    e.preventDefault();

    setAuthLoading(true);
    setAuthMessage("");

    try {
      const response = await fetch(
        `${API_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        setAuthMessage(
          data.error ||
            data.detail ||
            "Login failed."
        );
        setAuthMessageType("error");
        return;
      }

      if (!data.access_token) {
        setAuthMessage(
          "Login successful but token was not received."
        );
        setAuthMessageType("error");
        return;
      }

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      setToken(data.access_token);

      setEmail("");
      setPassword("");
      setAuthMessage("");
    } catch (error) {
      console.error("Login error:", error);

      setAuthMessage(
        "Unable to connect to server. Make sure FastAPI is running."
      );

      setAuthMessageType("error");
    } finally {
      setAuthLoading(false);
    }
  };

  // =========================================================
  // SIGNUP
  // =========================================================

  const signup = async (e) => {
    e.preventDefault();

    setAuthLoading(true);
    setAuthMessage("");

    if (password.length < 8) {
      setAuthMessage(
        "Password must contain at least 8 characters."
      );
      setAuthMessageType("error");
      setAuthLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        setAuthMessage(
          data.error ||
            data.detail?.[0]?.msg ||
            data.detail ||
            `Signup failed (${response.status})`
        );
        setAuthMessageType("error");
        return;
      }

      setAuthMessage(
        "Account created successfully! Please login."
      );

      setAuthMessageType("success");

      setAuthMode("login");
      setName("");
      setPassword("");
    } catch (error) {
      console.error("Signup error:", error);

      setAuthMessage(
        "Unable to connect to server. Make sure FastAPI is running."
      );

      setAuthMessageType("error");
    } finally {
      setAuthLoading(false);
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem("access_token");

    setToken(null);
    setCode("");
    setReview("");
    setHistory([]);
    setRating("");

    clearMessages();

    setAuthMode("login");
    setAuthMessage("");
  };

  // =========================================================
  // LOAD HISTORY AFTER LOGIN
  // =========================================================

  useEffect(() => {
    if (token) {
      loadHistory();
    }
  }, [token]);

  // =========================================================
  // DOWNLOAD PDF
  // =========================================================

  const downloadPDF = () => {
    if (!review) return;

    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);

    doc.text(
      "CodeLens AI - Code Review Report",
      20,
      20
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.text(
      `Language: ${language}`,
      20,
      30
    );

    if (
      rating !== "" &&
      rating !== null &&
      rating !== undefined
    ) {
      doc.text(
        `AI Score: ${rating}/10`,
        20,
        38
      );
    }

    const lines = doc.splitTextToSize(
      review,
      170
    );

    let y = 50;

    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      doc.text(line, 20, y);
      y += 6;
    });

    doc.save(
      "CodeLens_AI_Code_Review.pdf"
    );
  };

  // =========================================================
  // COPY REVIEW
  // =========================================================

  const copyReview = async () => {
    if (!review) return;

    try {
      await navigator.clipboard.writeText(
        review
      );

      setSuccessMessage(
        "Review copied successfully!"
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 2500);
    } catch (error) {
      console.error("Copy error:", error);

      setErrorMessage(
        "Unable to copy review."
      );
    }
  };

  // =========================================================
  // REVIEW CODE
  // =========================================================

  const reviewCode = async () => {
    clearMessages();

    if (!token) {
      setErrorMessage(
        "Please login first."
      );
      return;
    }

    if (!code.trim()) {
      setErrorMessage(
        "Please enter some code before starting the analysis."
      );
      return;
    }

    setLoading(true);
    setReview("");
    setRating("");

    try {
      const response = await fetch(
        `${API_URL}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            code,
            language,
          }),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.error ||
            data.detail ||
            "Code review failed."
        );
        return;
      }

      if (data.review) {
        setReview(data.review);

        if (
          data.score !== null &&
          data.score !== undefined &&
          data.score !== ""
        ) {
          setRating(String(data.score));
        }

        setSuccessMessage(
          "Code analysis completed successfully."
        );

        await loadHistory();
      } else {
        setErrorMessage(
          data.error ||
            data.detail ||
            "Something went wrong."
        );
      }
    } catch (error) {
      console.error("Review error:", error);

      setErrorMessage(
        "Unable to connect to server. Make sure your FastAPI server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // OPEN HISTORY REVIEW
  // =========================================================

  const openHistoryReview = (item) => {
    setCode(item.code || "");

    setLanguage(
      item.language || "python"
    );

    setReview(item.review || "");

    setRating(
      item.score !== null &&
        item.score !== undefined &&
        item.score !== ""
        ? String(item.score)
        : ""
    );

    clearMessages();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // AUTH SCREEN
  // =========================================================

  if (!token) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center px-4 relative overflow-hidden">

        <div className="absolute w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />

        <div className="absolute w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse" />

        <div className="relative w-full max-w-md">

          <div className="bg-[#111827]/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8">

            <div className="text-center mb-8">

              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20 animate-float">
                🤖
              </div>

              <h1 className="text-3xl font-bold">
                CodeLens AI
              </h1>

              <p className="text-gray-400 mt-2">
                Intelligent code review powered by AI
              </p>

            </div>

            {authMode === "login" && (
              <form
                onSubmit={login}
                className="space-y-4"
              >

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
                  className="w-full bg-[#0b1220] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#0b1220] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition"
                />

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition disabled:opacity-50"
                >
                  {authLoading
                    ? "Signing in..."
                    : "Sign In →"}
                </button>

                <p className="text-center text-sm text-gray-400">

                  Don't have an account?{" "}

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthMessage("");
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Create one
                  </button>

                </p>

              </form>
            )}

            {authMode === "signup" && (
              <form
                onSubmit={signup}
                className="space-y-4"
              >

                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                  autoComplete="name"
                  className="w-full bg-[#0b1220] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition"
                />

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
                  className="w-full bg-[#0b1220] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition"
                />

                <input
                  type="password"
                  placeholder="Password (minimum 8 characters)"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full bg-[#0b1220] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition"
                />

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 transition disabled:opacity-50"
                >
                  {authLoading
                    ? "Creating account..."
                    : "Create Account →"}
                </button>

                <p className="text-center text-sm text-gray-400">

                  Already have an account?{" "}

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthMessage("");
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Sign in
                  </button>

                </p>

              </form>
            )}

            {authMessage && (
              <div
                className={`mt-5 rounded-xl p-3 text-sm text-center border ${
                  authMessageType === "error"
                    ? "bg-red-500/10 border-red-500/20 text-red-300"
                    : "bg-green-500/10 border-green-500/20 text-green-300"
                }`}
              >
                {authMessage}
              </div>
            )}

          </div>

          <p className="text-center text-gray-600 text-xs mt-5">
            Secure AI-powered developer workspace
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // MAIN DASHBOARD
  // =========================================================

  return (
    <div className="min-h-screen bg-[#070b14] text-white">

      {/* Ambient Background */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 blur-3xl rounded-full animate-pulse" />

        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full animate-pulse" />

      </div>

      <div className="relative flex min-h-screen">

        {/* SIDEBAR */}

        <aside className="hidden lg:flex w-64 border-r border-white/10 bg-[#0b101c]/85 backdrop-blur-xl flex-col p-5">

          <div className="flex items-center gap-3 mb-10">

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              🤖
            </div>

            <div>
              <h1 className="font-bold">
                CodeLens AI
              </h1>

              <p className="text-xs text-gray-500">
                Developer workspace
              </p>
            </div>

          </div>

          <nav className="space-y-2">

            <div className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              ◈ Dashboard
            </div>

            <div
              onClick={() =>
                document
                  .getElementById("code-workspace")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition cursor-pointer"
            >
              ◉ Code Review
            </div>

            <div
              onClick={() =>
                document
                  .getElementById("review-history")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition cursor-pointer"
            >
              ◷ Review History
            </div>

          </nav>

          <div className="mt-auto">

            <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-white/10 rounded-2xl p-4 mb-4">

              <p className="text-xs text-gray-500 mb-2">
                AI ENGINE
              </p>

              <div className="flex items-center gap-2">

                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />

                <span className="text-sm text-gray-300">
                  Gemini AI Online
                </span>

              </div>

            </div>

            <button
              onClick={logout}
              className="w-full border border-red-500/20 text-red-400 hover:bg-red-500/10 py-3 rounded-xl transition"
            >
              ↪ Logout
            </button>

          </div>

        </aside>

        {/* CONTENT */}

        <main className="flex-1 p-4 md:p-8">

          <div className="max-w-7xl mx-auto">

            {/* TOP BAR */}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-up">

              <div>

                <p className="text-blue-400 text-sm font-medium mb-1">
                  AI DEVELOPER WORKSPACE
                </p>

                <h1 className="text-3xl md:text-4xl font-bold">
                  Welcome back 👋
                </h1>

                <p className="text-gray-500 mt-2">
                  Analyze, improve and optimize your code with AI.
                </p>

              </div>

              <button
                onClick={logout}
                className="lg:hidden border border-red-500/20 text-red-400 px-5 py-2 rounded-xl"
              >
                Logout
              </button>

            </div>

            {/* MESSAGES */}

            {errorMessage && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-4 animate-slide-down">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-300 rounded-xl p-4 animate-slide-down">
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>{successMessage}</span>
                </div>
              </div>
            )}

            {/* STATS */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

              <div className="group bg-[#111827]/80 border border-white/10 rounded-2xl p-5 hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300">

                <div className="flex justify-between items-start">

                  <div>

                    <p className="text-gray-400 text-sm">
                      Total Reviews
                    </p>

                    <p className="text-3xl font-bold mt-2">
                      {totalReviews}
                    </p>

                  </div>

                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl">
                    ◈
                  </div>

                </div>

                <p className="text-xs text-gray-600 mt-4">
                  All-time analyses
                </p>

              </div>

              <div className="group bg-[#111827]/80 border border-white/10 rounded-2xl p-5 hover:border-green-500/40 hover:-translate-y-1 transition-all duration-300">

                <div className="flex justify-between items-start">

                  <div>

                    <p className="text-gray-400 text-sm">
                      Languages
                    </p>

                    <p className="text-3xl font-bold mt-2">
                      {languagesUsed}
                    </p>

                  </div>

                  <div className="w-11 h-11 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center text-xl">
                    {"</>"}
                  </div>

                </div>

                <p className="text-xs text-gray-600 mt-4">
                  Programming languages
                </p>

              </div>

              <div className="group bg-[#111827]/80 border border-white/10 rounded-2xl p-5 hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300">

                <div className="flex justify-between items-start">

                  <div>

                    <p className="text-gray-400 text-sm">
                      Today's Reviews
                    </p>

                    <p className="text-3xl font-bold mt-2">
                      {todaysReviews}
                    </p>

                  </div>

                  <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl">
                    ◷
                  </div>

                </div>

                <p className="text-xs text-gray-600 mt-4">
                  Reviews completed today
                </p>

              </div>

              <div className="group bg-[#111827]/80 border border-white/10 rounded-2xl p-5 hover:border-yellow-500/40 hover:-translate-y-1 transition-all duration-300">

                <div className="flex justify-between items-start">

                  <div>

                    <p className="text-gray-400 text-sm">
                      Average AI Score
                    </p>

                    <p className="text-3xl font-bold mt-2 text-yellow-400">

                      {averageScore ? (
                        <>
                          ⭐ {averageScore}
                          <span className="text-sm text-gray-500 ml-1">
                            /10
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500">
                          —
                        </span>
                      )}

                    </p>

                  </div>

                  <div className="w-11 h-11 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center text-xl">
                    ★
                  </div>

                </div>

                <p className="text-xs text-gray-600 mt-4">
                  Overall code quality
                </p>

              </div>

            </div>

            {/* WORKSPACE */}

            <div
              id="code-workspace"
              className="grid grid-cols-1 xl:grid-cols-5 gap-6"
            >

              {/* EDITOR */}

              <div className="xl:col-span-3 bg-[#0d1421] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

                <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                  <div>

                    <h2 className="font-semibold">
                      Code Workspace
                    </h2>

                    <p className="text-xs text-gray-500 mt-1">
                      Paste or write your code below
                    </p>

                  </div>

                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      setReview("");
                      setRating("");
                    }}
                    className="bg-[#111827] border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 outline-none focus:border-blue-500"
                  >

                    <option value="python">
                      Python
                    </option>

                    <option value="javascript">
                      JavaScript
                    </option>

                    <option value="java">
                      Java
                    </option>

                    <option value="cpp">
                      C++
                    </option>

                    <option value="c">
                      C
                    </option>

                  </select>

                </div>

                <div className="p-3">

                  <Editor
                    height="500px"
                    language={language}
                    theme="vs-dark"
                    value={code}
                    onChange={(value) =>
                      setCode(value || "")
                    }
                    options={{
                      minimap: {
                        enabled: false,
                      },
                      fontSize: 14,
                      padding: {
                        top: 15,
                      },
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      wordWrap: "on",
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      bracketPairColorization: {
                        enabled: true,
                      },
                    }}
                  />

                </div>

                <div className="p-5 pt-2">

                  <button
                    onClick={reviewCode}
                    disabled={loading || !code.trim()}
                    className="w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 transition shadow-lg shadow-blue-500/10 disabled:opacity-50"
                  >

                    {loading ? (
                      <span className="flex items-center justify-center gap-2">

                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                        AI is analyzing your code...

                      </span>
                    ) : (
                      "✦ Analyze Code with AI"
                    )}

                  </button>

                </div>

              </div>

              {/* AI RESULT */}

              <div className="xl:col-span-2 bg-[#0d1421] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

                <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center">

                  <div>

                    <h2 className="font-semibold">
                      AI Analysis
                    </h2>

                    <p className="text-xs text-gray-500 mt-1">
                      Intelligent code feedback
                    </p>

                  </div>

                  {review && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}

                </div>

                {rating !== "" &&
                  rating !== null &&
                  rating !== undefined && (
                    <div className="p-5 animate-fade-up">

                      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-5">

                        <div className="flex items-center justify-between">

                          <div>

                            <p className="text-xs uppercase tracking-wider text-gray-500">
                              Code Quality
                            </p>

                            <p className="text-4xl font-bold mt-1">

                              {rating}

                              <span className="text-lg text-gray-500">
                                /10
                              </span>

                            </p>

                          </div>

                          <div className="w-16 h-16 rounded-full border-4 border-blue-500/30 flex items-center justify-center text-2xl animate-float">
                            ⭐
                          </div>

                        </div>

                      </div>

                    </div>
                  )}

                {review && (
                  <div className="px-5 pb-4 flex gap-2">

                    <button
                      onClick={copyReview}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-lg text-sm transition"
                    >
                      📋 Copy
                    </button>

                    <button
                      onClick={downloadPDF}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-lg text-sm transition"
                    >
                      📄 PDF
                    </button>

                  </div>
                )}

                <div className="px-5 pb-5">

                  <div className="bg-[#080d16] border border-white/10 rounded-xl p-5 max-h-[470px] overflow-y-auto">

                    {review ? (

                      <div className="prose prose-invert prose-sm max-w-none animate-fade-up">

                        <ReactMarkdown
                          remarkPlugins={[
                            remarkGfm,
                          ]}
                        >
                          {review}
                        </ReactMarkdown>

                      </div>

                    ) : (

                      <div className="min-h-[350px] flex flex-col items-center justify-center text-center">

                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-3xl mb-4 animate-float">
                          ✦
                        </div>

                        <h3 className="font-semibold text-gray-300">
                          Ready for analysis
                        </h3>

                        <p className="text-sm text-gray-600 mt-2 max-w-xs">
                          Write or paste your code and let AI identify bugs, improvements, security issues and performance opportunities.
                        </p>

                      </div>

                    )}

                  </div>

                </div>

              </div>

            </div>

            {/* HISTORY */}

 <div
  id="review-history"
  className="mt-8"
>
  <div className="flex items-center justify-between mb-4">

    <div>
      <h2 className="text-2xl font-bold">
        Review History
      </h2>

      <p className="text-sm text-gray-500 mt-1">
        Your recent AI code analyses
      </p>
    </div>

    <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-3 py-2 rounded-lg">
      {history.length}{" "}
      {history.length === 1
        ? "review"
        : "reviews"}
    </span>

  </div>


  {/* SEARCH + FILTER */}
  <div className="flex flex-col sm:flex-row gap-3 mb-5">

    <input
      type="text"
      value={historySearch}
      onChange={(e) =>
        setHistorySearch(e.target.value)
      }
      placeholder="🔎 Search reviews..."
      className="flex-1 bg-[#0d1421] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 outline-none focus:border-blue-500"
    />

    <select
      value={historyLanguage}
      onChange={(e) =>
        setHistoryLanguage(e.target.value)
      }
      className="bg-[#0d1421] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 outline-none focus:border-blue-500"
    >
      <option value="all">
        All Languages
      </option>

      <option value="python">
        Python
      </option>

      <option value="javascript">
        JavaScript
      </option>

      <option value="java">
        Java
      </option>

      <option value="cpp">
        C++
      </option>

      <option value="c">
        C
      </option>
    </select>


    <button
      onClick={loadHistory}
      className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm transition"
    >
      🔄 Refresh
    </button>

  </div>


  {/* HISTORY LIST */}

  {history.length === 0 ? (

    <div className="bg-[#0d1421] border border-white/10 rounded-2xl p-10 text-center">

      <div className="text-4xl mb-4">
        📝
      </div>

      <h3 className="font-semibold text-gray-300">
        No reviews yet
      </h3>

      <p className="text-sm text-gray-600 mt-2">
        Your analyzed code will appear here.
      </p>

    </div>

  ) : (

    <div className="space-y-3">

      {history
        .filter((item) => {

          const search =
            historySearch
              .trim()
              .toLowerCase();

          const matchesSearch =
            !search ||
            item.code
              ?.toLowerCase()
              .includes(search) ||
            item.review
              ?.toLowerCase()
              .includes(search) ||
            item.language
              ?.toLowerCase()
              .includes(search);

          const matchesLanguage =
            historyLanguage === "all" ||
            item.language
              ?.toLowerCase() ===
              historyLanguage;

          return (
            matchesSearch &&
            matchesLanguage
          );
        })
        .map((item) => (

          <div
            key={item.id}
            className="bg-[#0d1421] border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition"
          >

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

              <div className="flex items-center gap-4">

                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  💻
                </div>

                <div>

                  <div className="flex items-center gap-3 flex-wrap">

                    <p className="font-semibold">
                      {(
                        item.language ||
                        "unknown"
                      ).toUpperCase()}
                    </p>

                    {item.score !== null &&
                      item.score !== "" &&
                      item.score !== undefined && (

                        <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded-md">

                          ⭐ {item.score}/10

                        </span>

                      )}

                  </div>

                  <p className="text-xs text-gray-500 mt-1">

                    {item.created_at
                      ? new Date(
                          item.created_at
                        ).toLocaleString()
                      : "Unknown date"}

                  </p>

                </div>

              </div>


              <div className="flex gap-2 flex-wrap">

                <button
                  onClick={() =>
                    openHistoryReview(item)
                  }
                  className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition text-sm"
                >
                  Open Review
                </button>


                <button
                  onClick={() =>
                    deleteReview(item.id)
                  }
                  className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition text-sm"
                >
                  Delete
                </button>

              </div>

            </div>

          </div>

        ))}

    </div>

  )}

</div>         

            {/* FOOTER */}

            <div className="text-center py-8 text-xs text-gray-600">
              CodeLens AI · AI-powered code intelligence
            </div>

          </div>

        </main>

      </div>

    </div>
  );
}

export default App;
