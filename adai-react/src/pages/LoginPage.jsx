import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    // Simulate auth — replace with real API call
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    // On success, set auth flag and go to dashboard
    localStorage.setItem('adai_auth', 'true')
    navigate("/dashboard");
  };

  return (
    <div className="auth-root">
      {/* Background grid + orbs */}
      <div className="auth-grid" aria-hidden />
      <div className="auth-orb auth-orb-violet" aria-hidden />
      <div className="auth-orb auth-orb-cyan" aria-hidden />

      {/* Back to landing */}
      <button className="auth-back" onClick={() => navigate("/")}>
        <svg viewBox="0 0 20 20" fill="currentColor" className="back-icon">
          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
        </svg>
        Back
      </button>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="logo-hex">⬡</span>
          <span className="logo-text">AdAI<span className="logo-accent"> Intelligence</span></span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your dashboard</p>

        {/* Form */}
        <div className="auth-form">
          <div className="field-group">
            <label className="field-label" htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              className="field-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="field-group">
            <div className="field-label-row">
              <label className="field-label" htmlFor="password">Password</label>
              <button className="forgot-link" type="button">Forgot password?</button>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              className="field-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            className={`btn-submit ${loading ? "btn-loading" : ""}`}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : null}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>

        <div className="auth-divider"><span>or</span></div>

        {/* Demo quick-access */}
        <button
          className="btn-demo"
          onClick={() => {
            setForm({ email: "demo@adai.in", password: "demo1234" });
            localStorage.setItem('adai_auth', 'true');
            setTimeout(() => navigate("/dashboard"), 400);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="demo-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          Continue with Demo Account
        </button>

        {/* <p className="auth-switch">
          Don't have an account?{" "}
          <button className="switch-link" onClick={() => navigate("/signup")}>Create one</button>
        </p> */}
      </div>
    </div>
  );
}
