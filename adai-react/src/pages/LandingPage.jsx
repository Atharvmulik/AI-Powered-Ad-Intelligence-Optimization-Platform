import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import OrbitalVisualization from "../components/landing/OrbitalVisualization";
import "../styles/landing.css";

const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const NAV = [
  { id: "features", label: "Features" },
  { id: "pipeline", label: "Architecture" },
  { id: "metrics", label: "Metrics" },
];

const FEATURES = [
  {
    title: "Click Prediction Engine",
    desc: "Gradient-boosted models (XGBoost, LightGBM) estimate click probability, with SHAP explanations showing which signals drove each score.",
    tag: "SHAP explainability",
    accent: "#4c91ff",
    path: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  },
  {
    title: "Real-Time Fraud Detection",
    desc: "An Isolation Forest and autoencoder ensemble scores events for anomalies such as bot clicks, click farms and synthetic traffic.",
    tag: "Anomaly scoring",
    accent: "#ff7185",
    path: "M12 9v3.75m-9.3 3.38c-.87 1.5.22 3.37 1.95 3.37h14.7c1.73 0 2.82-1.87 1.95-3.37L13.95 3.38c-.87-1.5-3.03-1.5-3.9 0L2.7 16.13zM12 15.75h.01v.01H12z",
  },
  {
    title: "Ad Recommendation Engine",
    desc: "Hybrid collaborative and content-based filtering ranks candidate ads for each user, with a diversity score to avoid repetitive results.",
    tag: "Personalized ranking",
    accent: "#12c9ee",
    path: "M9.8 15.9L9 18.75l-.8-2.85a4.5 4.5 0 00-3.1-3.1L2.25 12l2.85-.8a4.5 4.5 0 003.1-3.1L9 5.25l.8 2.85a4.5 4.5 0 003.1 3.1l2.85.8-2.85.8a4.5 4.5 0 00-3.1 3.1z",
  },
  {
    title: "Event Streaming Architecture",
    desc: "Prediction, fraud and recommendation run as independent consumers of one event stream. Kafka is the planned backbone for this layer.",
    tag: "Planned: Kafka",
    accent: "#bca7ff",
    path: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z",
  },
];

const PIPELINE = [
  { label: "Synthetic Events", sub: "Browser-style click and view events" },
  { label: "ML Scoring", sub: "CTR, fraud and ranking models" },
  { label: "PostgreSQL", sub: "Stores events and predictions" },
  { label: "API + WebSocket", sub: "FastAPI serves and pushes updates" },
  { label: "Dashboard", sub: "React UI with live updates" },
];

const PLANNED = [
  { label: "Apache Kafka", sub: "Event ingest backbone" },
  { label: "Redis", sub: "Hot prediction cache" },
];

const STACK = ["FastAPI", "XGBoost", "LightGBM", "SHAP", "Isolation Forest", "PostgreSQL", "React 19", "MLflow"];

const METRICS = [
  { num: "0.78", suffix: "+", label: "AUC-ROC target", sub: "Click model, held-out test set" },
  { num: "90", suffix: "%", label: "Fraud precision target", sub: "Keeps false positives low" },
  { num: "100", suffix: "ms", label: "End-to-end latency goal", sub: "Event to model response" },
  { num: "10", suffix: "K/s", label: "Throughput goal", sub: "Events per second, dev environment" },
];

function AnimatedCounter({ target, suffix = "" }) {
  const ref = useRef(null);
  const end = parseFloat(target);
  const decimals = (String(target).split(".")[1] || "").length;
  const [val, setVal] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let raf = 0;
    const run = () => {
      const duration = prefersReduced() ? 0 : 1400;
      const t0 = performance.now();
      const frame = (now) => {
        const p = duration ? Math.min((now - t0) / duration, 1) : 1;
        setVal(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { run(); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(node);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [end]);

  return <span ref={ref}>{val.toFixed(decimals)}{suffix}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const heroRef = useRef(null);
  const progressRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");

  const goTo = useCallback((id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
  }, []);

  // Scroll state + progress bar (one rAF-throttled listener)
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  // Scroll reveals (content stays visible if JS never runs)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = root.querySelectorAll("[data-reveal]");
    if (prefersReduced() || !("IntersectionObserver" in window)) {
      items.forEach((n) => n.classList.add("is-in"));
      return;
    }
    root.classList.add("js-ready");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    items.forEach((n) => io.observe(n));
    return () => { io.disconnect(); root.classList.remove("js-ready"); };
  }, []);

  // Active nav link
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    NAV.forEach((n) => { const el = document.getElementById(n.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  // Pointer-reactive hero background (no React re-renders)
  useEffect(() => {
    const el = heroRef.current;
    if (!el || prefersReduced() || !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    let tx = 50, ty = 40, x = 50, y = 40;
    const tick = () => {
      x += (tx - x) * 0.07;
      y += (ty - y) * 0.07;
      el.style.setProperty("--mx", x.toFixed(2));
      el.style.setProperty("--my", y.toFixed(2));
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e) => {
      const b = el.getBoundingClientRect();
      tx = ((e.clientX - b.left) / b.width) * 100;
      ty = ((e.clientY - b.top) / b.height) * 100;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    el.addEventListener("pointermove", onMove);
    return () => { el.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);

  const cardGlow = (e) => {
    const b = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--cx", `${e.clientX - b.left}px`);
    e.currentTarget.style.setProperty("--cy", `${e.clientY - b.top}px`);
  };

  return (
    <div className="landing-root" ref={rootRef}>
      <div className="scroll-progress" aria-hidden="true"><span ref={progressRef} /></div>

      {/* NAV */}
      <header className={`landing-nav ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="nav-inner">
          <a className="nav-logo" href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" }); }} aria-label="AdAI Intelligence home">
            <span className="logo-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="12" rx="9" ry="3.5" /><ellipse cx="12" cy="12" rx="3.5" ry="9" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /></svg>
            </span>
            <span className="logo-text">AdAI<span className="logo-accent"> Intelligence</span></span>
          </a>

          <nav className="nav-links" aria-label="Primary">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className={`nav-link ${active === n.id ? "is-active" : ""}`}
                aria-current={active === n.id ? "true" : undefined}
                onClick={(e) => { e.preventDefault(); goTo(n.id); }}>{n.label}</a>
            ))}
          </nav>

          <div className="nav-actions">
            <button className="btn-ghost" onClick={() => navigate("/login")}>Log in</button>
            <button className="btn-primary" onClick={() => navigate("/login")}>Launch Dashboard</button>
          </div>

          <button className={`hamburger ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen((p) => !p)}
            aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-menu">
            <span /><span /><span />
          </button>
        </div>

        <div id="mobile-menu" className={`mobile-menu ${menuOpen ? "is-open" : ""}`} inert={!menuOpen}>
          <div className="mobile-menu-inner">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} onClick={(e) => { e.preventDefault(); goTo(n.id); }}>{n.label}</a>
            ))}
            <button className="btn-ghost w-full" onClick={() => navigate("/login")}>Log in</button>
            <button className="btn-primary w-full" onClick={() => navigate("/signup")}>Get Started</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero-section" id="top" ref={heroRef}>
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-layer hero-ambient" />
          <div className="hero-layer hero-pointer" />
          <div className="hero-layer hero-grid" />
          <div className="hero-layer hero-vignette" />
        </div>

        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-pill enter" style={{ "--d": "80ms" }}>
              <span className="pill-dot" aria-hidden="true" />
              AI-POWERED AD INTELLIGENCE
            </div>

            <h1 className="hero-headline">
              <span className="enter line" style={{ "--d": "180ms" }}>Every Ad Decision,</span>
              <span className="enter line" style={{ "--d": "280ms" }}><span className="grad">Driven by</span></span>
              <span className="enter line" style={{ "--d": "380ms" }}><span className="grad">Intelligence.</span></span>
            </h1>

            

            <div className="hero-cta-row enter" style={{ "--d": "620ms", marginTop: "12px" }}>
              <button className="btn-primary btn-lg" onClick={() => navigate("/login")}>
                Launch Dashboard
                <svg viewBox="0 0 20 20" fill="currentColor" className="btn-icon" aria-hidden="true"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.64L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.16-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
              </button>
              <button className="btn-secondary btn-lg" onClick={() => goTo("pipeline")}>How It Works</button>
            </div>

            <p className="hero-trust enter" style={{ "--d": "720ms" }}>
              <span className="trust-dots" aria-hidden="true"><i /><i /><i /></span>
              Runs on a simulated event stream. No real traffic or customers.
            </p>
          </div>

          <div className="hero-visual enter-visual" style={{ "--d": "420ms" }}>
            <OrbitalVisualization />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section features-section">
        <div className="section-header" data-reveal>
          <p className="section-eyebrow">CORE MODULES</p>
          <h2 className="section-title">Four engines. One platform.</h2>
          <p className="section-sub">Each module is designed as an independent service, so prediction, fraud and ranking can scale on their own.</p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="reveal-wrap" data-reveal style={{ "--d": `${i * 90}ms` }}>
              <article className="feature-card" style={{ "--accent": f.accent }} onPointerMove={cardGlow}>
                <div className="feature-spot" aria-hidden="true" />
                <div className="feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d={f.path} /></svg>
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
                <span className="feature-tag">{f.tag}</span>
              </article>
            </div>
          ))}
        </div>
      </section>

      {/* PIPELINE */}
      <section id="pipeline" className="section pipeline-section">
        <div className="section-header" data-reveal>
          <p className="section-eyebrow">ARCHITECTURE</p>
          <h2 className="section-title">From event to insight</h2>
          <p className="section-sub">The working flow today, and the infrastructure planned to scale it.</p>
        </div>

        <p className="pipe-caption" data-reveal><span className="legend-dot on" aria-hidden="true" /> Implemented</p>
        <ol className="pipeline-track">
          {PIPELINE.map((p, i) => (
            <li key={p.label} className="pipe-item" data-reveal style={{ "--d": `${i * 110}ms` }}>
              <div className="pipeline-node">
                <span className="pipeline-step-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="pipeline-label">{p.label}</span>
                <span className="pipeline-sub">{p.sub}</span>
              </div>
              {i < PIPELINE.length - 1 && <span className="pipe-link" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        <p className="pipe-caption" data-reveal><span className="legend-dot" aria-hidden="true" /> Planned extensions</p>
        <ul className="pipeline-track planned">
          {PLANNED.map((p, i) => (
            <li key={p.label} className="pipe-item" data-reveal style={{ "--d": `${i * 110}ms` }}>
              <div className="pipeline-node is-planned">
                <span className="pipeline-step-num">PLANNED</span>
                <span className="pipeline-label">{p.label}</span>
                <span className="pipeline-sub">{p.sub}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="stack-pills" data-reveal>
          {STACK.map((t) => <span key={t} className="stack-pill">{t}</span>)}
        </div>

        <div className="terminal" data-reveal>
          <div className="terminal-bar">
            <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
            <span className="terminal-title">sample-output.json (static example, not live data)</span>
          </div>
          <pre className="terminal-body" tabIndex={0} aria-label="Static example of a prediction record">
<span className="t-key">event_id</span>:     <span className="t-str">"evt_9f3a2c"</span>{"\n"}
<span className="t-key">click_prob</span>:   <span className="t-num">0.847</span>{"\n"}
<span className="t-key">fraud_score</span>:  <span className="t-green">0.031</span>  <span className="t-badge-safe">CLEAN</span>{"\n"}
<span className="t-key">shap_top</span>:     <span className="t-str">"interest=sports +0.29"</span>{"\n"}
{"\n"}
<span className="t-key">event_id</span>:     <span className="t-str">"evt_b17d9e"</span>{"\n"}
<span className="t-key">fraud_score</span>:  <span className="t-red">0.974</span>  <span className="t-badge-fraud">FLAGGED</span>{"\n"}
<span className="t-key">click_velocity</span>: <span className="t-red">482/min</span><span className="t-cursor">█</span>
          </pre>
        </div>
      </section>

      {/* METRICS */}
      <section id="metrics" className="section metrics-section">
        <div className="section-header" data-reveal>
          <p className="section-eyebrow">DESIGN TARGETS</p>
          <h2 className="section-title">What the platform is built to hit</h2>
          <p className="section-sub">These are project goals for a development environment, not production results.</p>
        </div>

        <div className="metrics-grid">
          {METRICS.map((m, i) => (
            <div key={m.label} className="reveal-wrap" data-reveal style={{ "--d": `${i * 90}ms` }}>
              <div className="metric-card">
                <div className="metric-number"><AnimatedCounter target={m.num} suffix={m.suffix} /></div>
                <div className="metric-label">{m.label}</div>
                <div className="metric-sub">{m.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-strip">
        <div className="cta-strip-inner" data-reveal>
          <h2 className="cta-strip-title">Ready to explore the platform?</h2>
          <p className="cta-strip-sub">Log in to see predictions, fraud scores and recommendations on the live dashboard.</p>
          <button className="btn-primary btn-lg" onClick={() => navigate("/login")}>Log in to Dashboard</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="nav-logo">
            <span className="logo-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="12" rx="9" ry="3.5" /><ellipse cx="12" cy="12" rx="3.5" ry="9" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /></svg>
            </span>
            <span className="logo-text">AdAI<span className="logo-accent"> Intelligence</span></span>
          </div>
          <p className="footer-copy">AI-Powered Ad Intelligence Optimization Platform · Portfolio Project · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}