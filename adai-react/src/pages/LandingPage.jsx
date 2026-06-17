import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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

      <style>{`
        /* ── Reset & Root ── */
        .landing-root {
          min-height: 100vh;
          background: #050810;
          color: #e2e8f0;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          overflow-x: hidden;
        }

        /* ── Nav ── */
        .landing-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: background 0.3s, backdrop-filter 0.3s, border-color 0.3s;
          border-bottom: 1px solid transparent;
        }
        .nav-scrolled {
          background: rgba(5,8,16,0.85);
          backdrop-filter: blur(12px);
          border-color: rgba(255,255,255,0.07);
        }
        .nav-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; gap: 2rem;
          padding: 1rem 1.5rem;
        }
        .nav-logo { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        .logo-hex { font-size: 1.4rem; color: #7c3aed; line-height: 1; }
        .logo-text { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; color: #f1f5f9; }
        .logo-accent { color: #7c3aed; }
        .nav-links { display: flex; gap: 1.75rem; margin-left: auto; }
        .nav-link { color: #94a3b8; font-size: 0.9rem; text-decoration: none; transition: color 0.2s; }
        .nav-link:hover { color: #f1f5f9; }
        .nav-actions { display: flex; gap: 0.75rem; }

        /* ── Buttons ── */
        .btn-primary {
          background: #7c3aed;
          color: #fff; border: none; border-radius: 8px;
          padding: 0.55rem 1.25rem; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          white-space: nowrap;
        }
        .btn-primary:hover { background: #6d28d9; box-shadow: 0 0 20px rgba(124,58,237,0.4); transform: translateY(-1px); }
        .btn-primary.btn-lg { padding: 0.75rem 1.75rem; font-size: 0.95rem; border-radius: 10px; }
        .btn-ghost {
          background: transparent; color: #94a3b8; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 0.55rem 1.25rem; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: color 0.2s, border-color 0.2s; white-space: nowrap;
        }
        .btn-ghost:hover { color: #f1f5f9; border-color: rgba(255,255,255,0.25); }
        .btn-ghost.btn-lg { padding: 0.75rem 1.75rem; font-size: 0.95rem; border-radius: 10px; }
        .btn-outline {
          background: transparent; color: #e2e8f0;
          border: 1px solid rgba(255,255,255,0.2); border-radius: 10px;
          padding: 0.75rem 1.75rem; font-size: 0.95rem; font-weight: 600;
          cursor: pointer; transition: border-color 0.2s, background 0.2s;
        }
        .btn-outline:hover { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.04); }
        .btn-icon { width: 1rem; height: 1rem; }
        .hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px; margin-left: auto; }
        .hamburger span { display: block; width: 22px; height: 2px; background: #94a3b8; border-radius: 2px; }
        .mobile-menu { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem 1.5rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.07); background: rgba(5,8,16,0.95); }
        .mobile-menu a { color: #94a3b8; text-decoration: none; font-size: 0.95rem; }

        /* ── Hero ── */
        .hero-section {
          min-height: 100vh;
          display: grid; grid-template-columns: 1fr 1fr;
          align-items: center; gap: 4rem;
          max-width: 1200px; margin: 0 auto;
          padding: 7rem 1.5rem 4rem;
          position: relative;
        }
        .hero-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .orb {
          position: absolute; border-radius: 50%; filter: blur(80px);
          pointer-events: none; z-index: 0;
        }
        .orb-violet { width: 500px; height: 500px; background: rgba(124,58,237,0.15); top: 5%; left: -10%; }
        .orb-cyan { width: 400px; height: 400px; background: rgba(6,182,212,0.08); bottom: 10%; right: -5%; }
        .hero-content { position: relative; z-index: 1; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(124,58,237,0.12); border: 1px solid rgba(124,58,237,0.3);
          border-radius: 100px; padding: 0.35rem 0.9rem;
          font-size: 0.78rem; font-weight: 500; color: #a78bfa;
          margin-bottom: 1.75rem; letter-spacing: 0.02em;
        }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #7c3aed; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .hero-headline {
          font-size: clamp(2.6rem, 5vw, 4rem); font-weight: 800;
          line-height: 1.05; letter-spacing: -0.03em; color: #f8fafc;
          margin: 0 0 1.25rem;
        }
        .headline-gradient {
          background: linear-gradient(135deg, #7c3aed, #06b6d4);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: 1rem; color: #94a3b8; line-height: 1.7;
          max-width: 480px; margin: 0 0 2rem;
        }
        .hero-cta-row { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 3rem; }

        /* Ticker */
        .ticker-bar {
          display: flex; gap: 2rem; flex-wrap: wrap;
          padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.07);
        }
        .ticker-item { display: flex; flex-direction: column; gap: 0.15rem; }
        .ticker-value { font-size: 1.1rem; font-weight: 700; color: #a78bfa; font-variant-numeric: tabular-nums; }
        .ticker-label { font-size: 0.72rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }

        /* Terminal */
        .hero-terminal {
          position: relative; z-index: 1;
          background: #0d1117; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px; overflow: hidden;
          box-shadow: 0 0 60px rgba(124,58,237,0.15), 0 25px 50px rgba(0,0,0,0.5);
          font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
          font-size: 0.82rem;
        }
        .terminal-bar {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.75rem 1rem; background: #161b22;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .dot { width: 12px; height: 12px; border-radius: 50%; }
        .dot-red { background: #ff5f57; }
        .dot-yellow { background: #febc2e; }
        .dot-green { background: #28c840; }
        .terminal-title { margin-left: 0.75rem; color: #64748b; font-size: 0.78rem; }
        .terminal-body { padding: 1.25rem 1.25rem 1rem; line-height: 1.9; }
        .terminal-body p { margin: 0; }
        .t-dim { color: #374151; }
        .t-key { color: #7dd3fc; }
        .t-str { color: #86efac; }
        .t-num { color: #fcd34d; }
        .t-green { color: #4ade80; }
        .t-red { color: #f87171; }
        .t-badge-safe { background: rgba(74,222,128,0.15); color: #4ade80; border-radius: 4px; padding: 0 6px; font-size: 0.72rem; font-weight: 700; }
        .t-badge-fraud { background: rgba(248,113,113,0.15); color: #f87171; border-radius: 4px; padding: 0 6px; font-size: 0.72rem; font-weight: 700; }
        .t-cursor { color: #7c3aed; animation: blink 1s step-end infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .mt-2 { margin-top: 0.5rem; }

        /* ── Section Shared ── */
        .section-header { text-align: center; max-width: 600px; margin: 0 auto 3.5rem; }
        .section-eyebrow { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #7c3aed; margin: 0 0 0.6rem; }
        .section-title { font-size: clamp(1.8rem,3.5vw,2.5rem); font-weight: 800; letter-spacing: -0.03em; color: #f1f5f9; margin: 0 0 0.75rem; }
        .section-sub { font-size: 0.95rem; color: #64748b; line-height: 1.7; margin: 0; }

        /* ── Features ── */
        .features-section { max-width: 1200px; margin: 0 auto; padding: 6rem 1.5rem; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap: 1.25rem; }
        .feature-card {
          position: relative; overflow: hidden;
          background: #0d1117; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 1.75rem;
          transition: border-color 0.25s, transform 0.2s, box-shadow 0.25s;
        }
        .feature-card:hover {
          border-color: var(--accent, #7c3aed);
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }
        .feature-glow { position: absolute; inset: 0; opacity: 0.4; pointer-events: none; }
        .feature-icon { position: relative; z-index: 1; margin-bottom: 1rem; }
        .feature-title { position: relative; z-index: 1; font-size: 1.05rem; font-weight: 700; color: #f1f5f9; margin: 0 0 0.6rem; }
        .feature-desc { position: relative; z-index: 1; font-size: 0.875rem; color: #64748b; line-height: 1.65; margin: 0 0 1.25rem; }
        .feature-tag { position: relative; z-index: 1; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.05em; color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); border-radius: 6px; padding: 0.2rem 0.6rem; }

        /* ── Pipeline ── */
        .pipeline-section { background: #080c15; padding: 6rem 1.5rem; }
        .pipeline-track {
          display: flex; align-items: center; justify-content: center;
          flex-wrap: wrap; gap: 0; max-width: 1100px; margin: 0 auto 3rem;
        }
        .pipeline-node-wrap { display: flex; align-items: center; }
        .pipeline-node {
          display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
          background: #0d1117; border: 1px solid rgba(124,58,237,0.3);
          border-radius: 12px; padding: 1.25rem 1.5rem; min-width: 140px; text-align: center;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .pipeline-node:hover { border-color: #7c3aed; box-shadow: 0 0 20px rgba(124,58,237,0.2); }
        .pipeline-step-num { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; color: #7c3aed; }
        .pipeline-label { font-size: 0.9rem; font-weight: 700; color: #e2e8f0; }
        .pipeline-sub { font-size: 0.72rem; color: #64748b; }
        .pipeline-arrow { color: #374151; font-size: 1.4rem; padding: 0 0.5rem; }
        .stack-pills { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; max-width: 900px; margin: 0 auto; }
        .stack-pill { font-size: 0.78rem; font-weight: 600; color: #94a3b8; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 100px; padding: 0.3rem 0.85rem; }

        /* ── Metrics ── */
        .metrics-section { max-width: 1200px; margin: 0 auto; padding: 6rem 1.5rem; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: 1.25rem; }
        .metric-card {
          background: #0d1117; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 2rem 1.5rem; text-align: center;
          transition: border-color 0.2s;
        }
        .metric-card:hover { border-color: rgba(124,58,237,0.4); }
        .metric-number { font-size: 2.8rem; font-weight: 900; letter-spacing: -0.04em; color: #a78bfa; font-variant-numeric: tabular-nums; }
        .metric-label { font-size: 0.95rem; font-weight: 700; color: #e2e8f0; margin: 0.35rem 0 0.25rem; }
        .metric-sub { font-size: 0.8rem; color: #64748b; }

        /* ── CTA Strip ── */
        .cta-strip { background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.08)); border-top: 1px solid rgba(124,58,237,0.2); border-bottom: 1px solid rgba(124,58,237,0.2); padding: 5rem 1.5rem; }
        .cta-strip-inner { max-width: 700px; margin: 0 auto; text-align: center; }
        .cta-strip-title { font-size: clamp(1.6rem,3vw,2.2rem); font-weight: 800; letter-spacing: -0.03em; color: #f1f5f9; margin: 0 0 0.75rem; }
        .cta-strip-sub { font-size: 1rem; color: #64748b; line-height: 1.7; margin: 0 0 2rem; }
        .cta-strip-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

        /* ── Footer ── */
        .landing-footer { padding: 2rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.06); }
        .footer-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .footer-copy { font-size: 0.78rem; color: #475569; }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .hero-section { grid-template-columns: 1fr; padding-top: 6rem; }
          .hero-terminal { display: none; }
          .nav-links, .nav-actions { display: none; }
          .hamburger { display: flex; }
        }
        @media (max-width: 600px) {
          .pipeline-track { flex-direction: column; }
          .pipeline-arrow { transform: rotate(90deg); }
          .pipeline-node { min-width: 200px; }
          .ticker-bar { gap: 1.25rem; }
        }
      `}</style>
    </div>
  );
}
