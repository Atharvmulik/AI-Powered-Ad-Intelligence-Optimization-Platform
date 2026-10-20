
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import "../styles/login.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    const email = form.email.trim();

    if (!email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Authenticate against the actual FastAPI backend.
      const result = await  authService.login({
        email,
        password: form.password,
      });

      // Store the token only after successful authentication.
      // Never set an authentication flag before verification.
      sessionStorage.setItem("adai_access_token", result.access_token);
      sessionStorage.setItem(
        "adai_user",
        JSON.stringify(result.user)
      );

      // Keep compatibility with existing code that checks this flag.
      sessionStorage.setItem("adai_auth", "true");

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Unable to connect to the server. Please check that the backend is running."
          : err.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-root">
      {/* Atmosphere */}
      <div className="lg-bg" aria-hidden="true">
        <i className="lg-glow" />
        <i className="lg-grid" />
        <i className="lg-ring lg-r1" />
        <i className="lg-ring lg-r2" />
        <i className="lg-ring lg-r3" />
        <i className="lg-sweep" />

        {[
          ["12%", "22%", "7s"],
          ["84%", "18%", "9s"],
          ["20%", "78%", "8s"],
          ["78%", "74%", "10s"],
          ["50%", "10%", "11s"],
          ["92%", "50%", "8.5s"],
        ].map(([x, y, d], k) => (
          <b
            key={k}
            style={{
              "--x": x,
              "--y": y,
              "--d": d,
            }}
          />
        ))}
      </div>

      <button
        className="lg-back"
        type="button"
        onClick={() => navigate("/")}
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="lg-back-icon"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        Back
      </button>

      <main className="lg-card">
        <div className="lg-logo">
          <span className="lg-mark" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="8" />
              <ellipse cx="12" cy="12" rx="3.5" ry="8" />
              <path d="M4 12h16" />
            </svg>
          </span>

          <span className="lg-logo-text">
            AdAI<span> Intelligence</span>
          </span>
        </div>

        <h1 className="lg-title">Welcome back</h1>
        <p className="lg-sub">Sign in to your dashboard</p>

        <form
          className="lg-form"
          onSubmit={handleLogin}
          noValidate
        >
          <div className="lg-field">
            <label className="lg-label" htmlFor="email">
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              className="lg-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              disabled={loading}
            />
          </div>

          <div className="lg-field">
            <div className="lg-label-row">
              <label className="lg-label" htmlFor="password">
                Password
              </label>
            </div>

            <div className="lg-pw">
              <input
                id="password"
                name="password"
                type={showPw ? "text" : "password"}
                className="lg-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                className="lg-eye"
                onClick={() => setShowPw((previous) => !previous)}
                aria-label={showPw ? "Hide password" : "Show password"}
                aria-pressed={showPw}
                disabled={loading}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div
            className="lg-error"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>

          <button
            type="submit"
            className={`lg-submit ${loading ? "is-loading" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <span
                className="lg-spinner"
                aria-hidden="true"
              />
            ) : null}

            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="lg-divider">
          <span>Authorized access only</span>
        </div>
      </main>
    </div>
  );
}
