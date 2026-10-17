import { useEffect, useRef } from "react";

const PARTICLES = [
  { r: 238, s: 3.2, d: 46, a: 0, c: "#12c9ee" },
  { r: 215, s: 2.2, d: 38, a: 70, c: "#4c91ff" },
  { r: 190, s: 3.8, d: 52, a: 140, c: "#12c9ee" },
  { r: 170, s: 1.8, d: 34, a: 210, c: "#f0f2f7" },
  { r: 245, s: 2.6, d: 60, a: 280, c: "#4c91ff" },
  { r: 205, s: 4.2, d: 44, a: 320, c: "#12c9ee" },
  { r: 160, s: 2.4, d: 30, a: 40, c: "#12c9ee" },
  { r: 228, s: 1.8, d: 56, a: 100, c: "#f0f2f7" },
  { r: 182, s: 3, d: 48, a: 180, c: "#4c91ff" },
  { r: 248, s: 4.4, d: 70, a: 240, c: "#12c9ee" },
  { r: 150, s: 2, d: 28, a: 300, c: "#12c9ee" },
  { r: 222, s: 2.8, d: 42, a: 20, c: "#4c91ff" },
  { r: 196, s: 1.6, d: 36, a: 120, c: "#f0f2f7" },
  { r: 236, s: 3.4, d: 64, a: 200, c: "#12c9ee" },
  { r: 176, s: 2.2, d: 40, a: 260, c: "#4c91ff" },
  { r: 212, s: 3.6, d: 50, a: 340, c: "#12c9ee" },
];

const BAR_HEIGHTS = [40, 62, 48, 78, 58, 90];
const RANK_WIDTHS = [92, 71, 54];

export default function OrbitalVisualization() {
  const wrapRef = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduced || !fine) return;

    let raf = 0;
    let tx = 0, ty = 0, x = 0, y = 0;
    const tick = () => {
      x += (tx - x) * 0.09;
      y += (ty - y) * 0.09;
      el.style.setProperty("--ry", `${x.toFixed(2)}deg`);
      el.style.setProperty("--rx", `${y.toFixed(2)}deg`);
      el.style.setProperty("--px", `${(x * 1.6).toFixed(2)}px`);
      el.style.setProperty("--py", `${(-y * 1.6).toFixed(2)}px`);
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.02 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onMove = (e) => {
      const b = el.getBoundingClientRect();
      tx = ((e.clientX - b.left) / b.width - 0.5) * 14;
      ty = ((e.clientY - b.top) / b.height - 0.5) * -14;
      kick();
    };
    const onLeave = () => { tx = 0; ty = 0; kick(); };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="orbital-wrap" ref={wrapRef}>
      <div className="orbital-stage">
        <svg className="orbital-svg" viewBox="0 0 500 500" aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id="coreFill" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#2a3550" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#141a28" stopOpacity="0.5" />
            </radialGradient>
            <linearGradient id="ringStroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4c91ff" />
              <stop offset="55%" stopColor="#397ff4" />
              <stop offset="100%" stopColor="#12c9ee" />
            </linearGradient>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
          </defs>

          <circle className="orb-halo" cx="250" cy="250" r="120" fill="#12c9ee" filter="url(#softGlow)" />
          <g className="orb-core">
            <circle cx="250" cy="250" r="118" fill="url(#coreFill)" />
          </g>

          <g className="ring ring-t"><ellipse cx="250" cy="250" rx="228" ry="168" fill="none" stroke="url(#ringStroke)" strokeWidth="2.6" opacity="0.9" /></g>
          <g className="ring ring-v"><ellipse cx="250" cy="250" rx="120" ry="226" fill="none" stroke="url(#ringStroke)" strokeWidth="3" /></g>
          <g className="ring ring-h"><ellipse cx="250" cy="250" rx="232" ry="38" fill="none" stroke="url(#ringStroke)" strokeWidth="3.4" /></g>
          <circle className="ring-edge" cx="250" cy="250" r="226" fill="none" stroke="#4c91ff" strokeWidth="1" opacity="0.25" />

          {PARTICLES.map((p, i) => (
            <g key={i} className="particle-orbit" style={{ "--d": `${p.d}s`, "--a": `${p.a}deg` }}>
              <circle className="particle" cx={250 + p.r} cy="250" r={p.s} fill={p.c} style={{ "--pd": `${3 + (i % 4)}s` }} />
            </g>
          ))}
        </svg>
      </div>

      <article className="fcard fc-ctr">
        <div className="fc-head">
          <span className="fc-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
          </span>
          <div><h3>CTR Prediction</h3><p>MODEL INFERENCE</p></div>
        </div>
        <div className="fc-bars" aria-hidden="true">
          {BAR_HEIGHTS.map((h, i) => <span key={i} style={{ "--h": `${h}%`, "--i": i }} />)}
        </div>
        <span className="fc-tag">illustrative</span>
      </article>

      <article className="fcard fc-fraud">
        <div className="fc-head">
          <span className="fc-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.04A11.96 11.96 0 013.6 6 12 12 0 003 9.75c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.3-.2-2.55-.6-3.75-2.3 0-4.4-.9-6-2.29z" /></svg>
          </span>
          <div><h3>Fraud Detection</h3><p>ANOMALY SCORING</p></div>
        </div>
        <div className="fc-chips" aria-hidden="true">
          <span className="chip chip-ok">● Clean</span>
          <span className="chip chip-bad">▲ Flagged</span>
        </div>
        <span className="fc-tag">illustrative</span>
      </article>

      <article className="fcard fc-rec">
        <div className="fc-head">
          <span className="fc-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M9.8 15.9L9 18.75l-.8-2.85a4.5 4.5 0 00-3.1-3.1L2.25 12l2.85-.8a4.5 4.5 0 003.1-3.1L9 5.25l.8 2.85a4.5 4.5 0 003.1 3.1l2.85.8-2.85.8a4.5 4.5 0 00-3.1 3.1z" /></svg>
          </span>
          <div><h3>Smart Recommendations</h3><p>PERSONALIZED RANKING</p></div>
        </div>
        <div className="fc-rank" aria-hidden="true">
          {RANK_WIDTHS.map((w, i) => <span key={i} style={{ "--w": `${w}%`, "--i": i }} />)}
        </div>
        <span className="fc-tag">illustrative</span>
      </article>
    </div>
  );
}
