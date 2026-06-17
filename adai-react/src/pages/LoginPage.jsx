import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

      <style>{`
        .auth-root {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: #050810;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          padding: 1.5rem; position: relative; overflow: hidden;
        }
        .auth-grid {
          position: fixed; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .auth-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .auth-orb-violet { width: 500px; height: 500px; background: rgba(124,58,237,0.12); top: -15%; left: -15%; }
        .auth-orb-cyan { width: 350px; height: 350px; background: rgba(6,182,212,0.07); bottom: -10%; right: -10%; }

        .auth-back {
          position: fixed; top: 1.5rem; left: 1.5rem;
          display: flex; align-items: center; gap: 0.4rem;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 0.45rem 0.85rem;
          color: #94a3b8; font-size: 0.85rem; font-family: inherit;
          cursor: pointer; transition: color 0.2s, border-color 0.2s; z-index: 10;
        }
        .auth-back:hover { color: #f1f5f9; border-color: rgba(255,255,255,0.25); }
        .back-icon { width: 1rem; height: 1rem; }

        .auth-card {
          position: relative; z-index: 1;
          width: 100%; max-width: 420px;
          background: #0d1117; border: 1px solid rgba(255,255,255,0.09);
          border-radius: 18px; padding: 2.5rem;
          box-shadow: 0 0 60px rgba(124,58,237,0.12), 0 25px 50px rgba(0,0,0,0.5);
        }

        .auth-logo { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.75rem; }
        .logo-hex { font-size: 1.4rem; color: #7c3aed; line-height: 1; }
        .logo-text { font-size: 1.05rem; font-weight: 700; letter-spacing: -0.02em; color: #f1f5f9; }
        .logo-accent { color: #7c3aed; }

        .auth-title { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.03em; color: #f8fafc; margin: 0 0 0.3rem; }
        .auth-sub { font-size: 0.9rem; color: #64748b; margin: 0 0 2rem; }

        .auth-form { display: flex; flex-direction: column; gap: 1.1rem; }
        .field-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .field-label-row { display: flex; justify-content: space-between; align-items: center; }
        .field-label { font-size: 0.82rem; font-weight: 600; color: #94a3b8; }
        .forgot-link { background: none; border: none; font-size: 0.78rem; color: #7c3aed; cursor: pointer; font-family: inherit; padding: 0; }
        .forgot-link:hover { color: #a78bfa; }
        .field-input {
          background: #161b22; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 0.7rem 1rem;
          color: #f1f5f9; font-size: 0.9rem; font-family: inherit;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%; box-sizing: border-box;
        }
        .field-input::placeholder { color: #374151; }
        .field-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }

        .auth-error { font-size: 0.82rem; color: #f87171; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); border-radius: 8px; padding: 0.6rem 0.9rem; }

        .btn-submit {
          width: 100%; padding: 0.8rem;
          background: #7c3aed; color: #fff; border: none;
          border-radius: 10px; font-size: 0.95rem; font-weight: 700;
          cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
          margin-top: 0.25rem;
        }
        .btn-submit:hover:not(:disabled) { background: #6d28d9; box-shadow: 0 0 20px rgba(124,58,237,0.4); transform: translateY(-1px); }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        .spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .auth-divider {
          display: flex; align-items: center; gap: 1rem;
          margin: 1.5rem 0; color: #374151; font-size: 0.8rem;
        }
        .auth-divider::before, .auth-divider::after {
          content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.07);
        }

        .btn-demo {
          width: 100%; padding: 0.75rem;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: #94a3b8; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .btn-demo:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.2); color: #f1f5f9; }
        .demo-icon { width: 1rem; height: 1rem; }

        .auth-switch { text-align: center; font-size: 0.85rem; color: #64748b; margin: 1.5rem 0 0; }
        .switch-link { background: none; border: none; color: #7c3aed; font-size: 0.85rem; font-family: inherit; cursor: pointer; padding: 0; font-weight: 600; }
        .switch-link:hover { color: #a78bfa; }
      `}</style>
    </div>
  );
}
