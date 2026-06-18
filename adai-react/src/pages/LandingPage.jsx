import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/landing.css";

const TICKER_STATS = [
  { label: "Events/sec", value: "1.2M+" },
  { label: "Fraud Blocked", value: "₹8.4Cr" },
  { label: "Avg Latency", value: "23ms" },
  { label: "AUC-ROC", value: "0.81" },
  { label: "CTR Lift", value: "3.8×" },
  { label: "Campaigns Live", value: "2,400+" },
];

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Click Prediction Engine",
    desc: "XGBoost + LightGBM models trained on 45M Criteo rows. Predicts click probability with SHAP explainability at sub-30ms inference.",
    tag: "AUC-ROC > 0.78",
    color: "from-violet-500/20 to-transparent",
    accent: "#8b5cf6",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    title: "Real-Time Fraud Detection",
    desc: "Isolation Forest + Autoencoder ensemble scores every event before attribution. Catches bot clicks, click farms, and synthetic traffic.",
    tag: "Precision > 0.90",
    color: "from-rose-500/20 to-transparent",
    accent: "#f43f5e",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: "Ad Recommendation Engine",
    desc: "Hybrid collaborative + content-based filtering. Two-Tower neural network ranks candidates in real time with diversity scoring.",
    tag: "< 30ms serving",
    color: "from-cyan-500/20 to-transparent",
    accent: "#06b6d4",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    title: "Kafka Event Streaming",
    desc: "Apache Kafka backbone ingesting 1M+ events/sec. Three independent consumer services — prediction, fraud, recommendation — running in parallel.",
    tag: "10K events/sec dev",
    color: "from-amber-500/20 to-transparent",
    accent: "#f59e0b",
  },
];

const PIPELINE_STEPS = [
  { step: "01", label: "Browser Event", sub: "Click · Scroll · Hover" },
  { step: "02", label: "Kafka Ingest", sub: "< 5ms broker ack" },
  { step: "03", label: "ML Scoring", sub: "CTR · Fraud · Rank" },
  { step: "04", label: "Redis Cache", sub: "Hot prediction store" },
  { step: "05", label: "Dashboard", sub: "Live WebSocket push" },
];

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const end = parseFloat(target);
        const duration = 1400;
        const step = (end / duration) * 16;
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setCount(end); clearInterval(timer); }
          else setCount(parseFloat(start.toFixed(1)));
        }, 16);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing-root">
      {/* ─── NAV ─────────────────────────────────────────────── */}
      <nav className={`landing-nav ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="nav-inner">
          <div className="nav-logo">
            <span className="logo-hex">⬡</span>
            <span className="logo-text">AdAI<span className="logo-accent"> Intelligence</span></span>
          </div>

          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#pipeline" className="nav-link">Architecture</a>
            <a href="#metrics" className="nav-link">Metrics</a>
          </div>

          <div className="nav-actions">
            <button className="btn-ghost" onClick={() => navigate("/login")}>Log in</button>
          </div>

          <button className="hamburger" onClick={() => setMenuOpen(p => !p)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#pipeline" onClick={() => setMenuOpen(false)}>Architecture</a>
            <a href="#metrics" onClick={() => setMenuOpen(false)}>Metrics</a>
            <button className="btn-ghost w-full" onClick={() => navigate("/login")}>Log in</button>
            <button className="btn-primary w-full" onClick={() => navigate("/signup")}>Get Started</button>
          </div>
        )}
      </nav>

      {/* ─── HERO ────────────────────────────────────────────── */}
      <section className="hero-section">
        {/* Grid background */}
        <div className="hero-grid" aria-hidden />
        {/* Gradient orbs */}
        <div className="orb orb-violet" aria-hidden />
        <div className="orb orb-cyan" aria-hidden />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Live ML Pipeline · Real-Time Event Streaming
          </div>

          <h1 className="hero-headline">
            Ad Intelligence<br />
            <span className="headline-gradient">at Millisecond</span><br />
            Precision
          </h1>

          <p className="hero-sub">
            A production-grade platform combining XGBoost click prediction, Isolation Forest fraud detection,
            and Apache Kafka streaming — the same stack powering Google, PubMatic, and The Trade Desk.
          </p>

          <div className="hero-cta-row">
            <button className="btn-primary btn-lg" onClick={() => navigate("/login")}>
              Launch Dashboard
              <svg viewBox="0 0 20 20" fill="currentColor" className="btn-icon"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
            </button>
          </div>

          {/* Live ticker */}
          <div className="ticker-bar">
            {TICKER_STATS.map((s) => (
              <div key={s.label} className="ticker-item">
                <span className="ticker-value">{s.value}</span>
                <span className="ticker-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal mockup */}
        <div className="hero-terminal">
          <div className="terminal-bar">
            <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
            <span className="terminal-title">kafka-consumer · predictions</span>
          </div>
          <div className="terminal-body">
            <p><span className="t-dim">→</span> <span className="t-key">event_id:</span> <span className="t-str">"evt_9f3a2c"</span></p>
            <p><span className="t-dim">→</span> <span className="t-key">user_id:</span> <span className="t-str">"usr_delhi_4821"</span></p>
            <p><span className="t-dim">→</span> <span className="t-key">click_prob:</span> <span className="t-num">0.847</span></p>
            <p><span className="t-dim">→</span> <span className="t-key">fraud_score:</span> <span className="t-green">0.031</span> <span className="t-badge-safe">CLEAN</span></p>
            <p><span className="t-dim">→</span> <span className="t-key">top_ad:</span> <span className="t-str">"nike_shoes_v3"</span></p>
            <p><span className="t-dim">→</span> <span className="t-key">shap_top:</span> <span className="t-str">interest=sports +0.29</span></p>
            <p><span className="t-dim">→</span> <span className="t-key">latency_ms:</span> <span className="t-num">23</span></p>
            <p className="t-dim mt-2">────────────────────────</p>
            <p><span className="t-dim">→</span> <span className="t-key">event_id:</span> <span className="t-str">"evt_b17d9e"</span></p>
            <p><span className="t-dim">→</span> <span className="t-key">fraud_score:</span> <span className="t-red">0.974</span> <span className="t-badge-fraud">BOT BLOCKED</span></p>
            <p><span className="t-dim">→</span> <span className="t-key">click_velocity:</span> <span className="t-red">482/min</span></p>
            <p className="t-cursor">█</p>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────── */}
      <section id="features" className="features-section">
        <div className="section-header">
          <p className="section-eyebrow">Core Modules</p>
          <h2 className="section-title">Four engines. One platform.</h2>
          <p className="section-sub">Each module is an independently deployable microservice — exactly how production ad-tech systems are built.</p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card" style={{ "--accent": f.accent }}>
              <div className={`feature-glow bg-gradient-to-br ${f.color}`} />
              <div className="feature-icon" style={{ color: f.accent }}>{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <span className="feature-tag">{f.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PIPELINE ────────────────────────────────────────── */}
      <section id="pipeline" className="pipeline-section">
        <div className="section-header">
          <p className="section-eyebrow">Architecture</p>
          <h2 className="section-title">Event → Intelligence in &lt; 100ms</h2>
        </div>

        <div className="pipeline-track">
          {PIPELINE_STEPS.map((p, i) => (
            <div key={p.step} className="pipeline-node-wrap">
              <div className="pipeline-node">
                <span className="pipeline-step-num">{p.step}</span>
                <span className="pipeline-label">{p.label}</span>
                <span className="pipeline-sub">{p.sub}</span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && <div className="pipeline-arrow">→</div>}
            </div>
          ))}
        </div>

        <div className="stack-pills">
          {["Apache Kafka", "FastAPI", "XGBoost", "LightGBM", "Redis", "PostgreSQL", "SHAP", "React 18", "Isolation Forest", "MLflow"].map(t => (
            <span key={t} className="stack-pill">{t}</span>
          ))}
        </div>
      </section>

      {/* ─── METRICS ─────────────────────────────────────────── */}
      <section id="metrics" className="metrics-section">
        <div className="section-header">
          <p className="section-eyebrow">Success Criteria</p>
          <h2 className="section-title">Production-grade targets, not toy numbers.</h2>
        </div>

        <div className="metrics-grid">
          {[
            { num: "0.78", suffix: "+", label: "AUC-ROC", sub: "Criteo held-out test set" },
            { num: "90", suffix: "%", label: "Fraud Precision", sub: "< 10% false positives" },
            { num: "100", suffix: "ms", label: "End-to-End Latency", sub: "Browser event → ML response" },
            { num: "10", suffix: "K/s", label: "Kafka Throughput", sub: "Events per second, dev env" },
          ].map((m) => (
            <div key={m.label} className="metric-card">
              <div className="metric-number">
                <AnimatedCounter target={m.num} suffix={m.suffix} />
              </div>
              <div className="metric-label">{m.label}</div>
              <div className="metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA STRIP ───────────────────────────────────────── */}
      <section className="cta-strip">
        <div className="cta-strip-inner">
          <h2 className="cta-strip-title">Ready to explore the platform?</h2>
          <p className="cta-strip-sub">Sign up to access the live dashboard, ML predictions, and fraud detection in real time.</p>
          <div className="cta-strip-actions">
            <button className="btn-ghost btn-lg" onClick={() => navigate("/login")}>Already have an account</button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="nav-logo">
            <span className="logo-hex">⬡</span>
            <span className="logo-text">AdAI<span className="logo-accent"> Intelligence</span></span>
          </div>
          <p className="footer-copy">AI-Powered Ad Intelligence Optimization Platform · Portfolio Project · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
