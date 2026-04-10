import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(usernameOrEmail, loginPassword);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(username, email, password, displayName);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">🌸 Hazel&apos;s Archive 🌸</div>
          <p className="auth-subtitle">your very own space on the internet</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Login
          </button>
          <button
            className={`auth-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => { setMode("signup"); setError(""); }}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {mode === "login" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label>Username or Email</label>
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="your username or email"
                required
                autoFocus
              />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Logging in..." : "✨ Login"}
            </button>
            <p className="auth-switch">
              Don&apos;t have an account?{" "}
              <span className="auth-link" onClick={() => setMode("signup")}>
                Sign up!
              </span>
            </p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignup}>
            <div className="auth-field">
              <label>Username <span className="auth-required">*</span></label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="hazel123"
                required
                autoFocus
              />
              <small>Lowercase letters, numbers, underscores only</small>
            </div>
            <div className="auth-field">
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Hazel 🌸"
              />
            </div>
            <div className="auth-field">
              <label>Email <span className="auth-required">*</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hazel@example.com"
                required
              />
            </div>
            <div className="auth-field">
              <label>Password <span className="auth-required">*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="at least 6 characters"
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Creating account..." : "🌸 Create My Space"}
            </button>
            <p className="auth-switch">
              Already have an account?{" "}
              <span className="auth-link" onClick={() => setMode("login")}>
                Login!
              </span>
            </p>
          </form>
        )}

        <div className="auth-features">
          <p>✨ Customizable profiles</p>
          <p>🎵 Profile songs & playlists</p>
          <p>💌 Freedom wall & guestbook</p>
          <p>📸 Photo albums</p>
          <p>✍️ Blog posts</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
