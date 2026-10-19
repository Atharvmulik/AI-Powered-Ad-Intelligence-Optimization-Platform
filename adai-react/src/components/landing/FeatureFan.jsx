import { useState } from "react";
import "../../styles/feature-fan.css";

const OUTPUTS = [
  [["Click probability", "A score for each ad impression"], ["Top signals", "SHAP shows what pushed it up or down"], ["Models", "XGBoost and LightGBM"]],
  [["Anomaly score", "How unusual each event looks"], ["Clean or flagged", "A clear label for every event"], ["Signals", "Click velocity and traffic patterns"]],
  [["Ranked ads", "Best candidates first, per user"], ["Diversity score", "Avoids repeating the same ad"], ["Hybrid logic", "Collaborative plus content-based"]],
  [["Independent consumers", "Prediction, fraud and ranking in parallel"], ["One event stream", "Kafka is planned for this layer"], ["Scales per module", "Each service grows on its own"]],
];

const PARTICLES = [
  ["8%", "20%", "7s"], ["22%", "78%", "9s"], ["35%", "12%", "8s"], ["64%", "86%", "10s"],
  ["78%", "18%", "7.5s"], ["90%", "70%", "9.5s"], ["50%", "92%", "8.5s"], ["14%", "50%", "11s"],
];

const Chevron = ({ dir }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d={dir === "l" ? "M12 4l-6 6 6 6" : "M8 4l6 6-6 6"} />
  </svg>
);

function Visual({ i }) {
  if (i === 0) {
    return (
      <div className="fv fv-gauge">
        <svg viewBox="0 0 120 70">
          <path className="g-track" d="M10 62 A50 50 0 0 1 110 62" pathLength="100" />
          <path className="g-val" d="M10 62 A50 50 0 0 1 110 62" pathLength="100" />
        </svg>
        <div className="g-num">0.85<small>click probability</small></div>
        <ul className="shap">
          {[["interest", 82], ["device", 55], ["time of day", 36]].map(([n, w]) => (
            <li key={n}><span>{n}</span><i style={{ "--w": `${w}%` }} /></li>
          ))}
        </ul>
      </div>
    );
  }
  if (i === 1) {
    return (
      <div className="fv fv-feed">
        <ul>
          {[["evt_9f3a", 0], ["evt_b17d", 1], ["evt_c204", 0], ["evt_d8e1", 0]].map(([id, flag], k) => (
            <li key={id} className={flag ? "flag" : ""} style={{ "--k": k }}>
              <span>{id}</span><b>{flag ? "▲ Flagged" : "● Clean"}</b>
            </li>
          ))}
        </ul>
        <span className="scan" />
      </div>
    );
  }
  if (i === 2) {
    return (
      <ol className="fv fv-rank">
        {[["Ad A", 92], ["Ad B", 71], ["Ad C", 54]].map(([n, w], k) => (
          <li key={n} style={{ "--w": `${w}%` }}><em>#{k + 1}</em><span>{n}</span><i /></li>
        ))}
      </ol>
    );
  }
  return (
    <div className="fv fv-stream">
      {["predict", "fraud", "rank"].map((s, l) => (
        <div key={s} className="lane" style={{ "--l": l }}>
          <span>event</span>
          <div className="track">{[0, 1, 2].map((j) => <i key={j} style={{ "--j": j }} />)}</div>
          <span>{s}</span>
        </div>
      ))}
    </div>
  );
}

export default function FeatureFan({ features }) {
  const [focus, setFocus] = useState(1);
  const n = features.length;
  const go = (d) => setFocus((f) => Math.max(0, Math.min(n - 1, f + d)));
  const onKey = (e) => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };
  const glow = (e) => {
    const b = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--cx", `${e.clientX - b.left}px`);
    e.currentTarget.style.setProperty("--cy", `${e.clientY - b.top}px`);
  };

  return (
    <div className="fan-stage" style={{ "--accent": features[focus].accent }}>
      <div className="fs-bg" aria-hidden="true">
        <i className="ring r1" /><i className="ring r2" /><i className="ring r3" /><i className="sweep" />
        {PARTICLES.map(([x, y, d], k) => <b key={k} style={{ "--x": x, "--y": y, "--d": d }} />)}
      </div>

      <aside className="fs-side fs-left" aria-hidden="true">
        <div className="fs-index"><span>{String(focus + 1).padStart(2, "0")}</span><small>/ {String(n).padStart(2, "0")}</small></div>
        <div className="fs-panel" key={focus}>
          <p className="fs-label">{features[focus].title}</p>
          <Visual i={focus} />
          <span className="fs-ill">illustrative</span>
        </div>
      </aside>

      <div className="fan-wrap">
        <div className="fan" role="group" aria-label="Platform modules" onKeyDown={onKey}>
          {features.map((f, i) => {
            const o = i - focus;
            return (
              <article key={f.title} tabIndex={0} aria-current={o === 0}
                className={`fan-card ${o === 0 ? "is-focus" : ""}`}
                style={{ "--o": o, "--a": Math.abs(o), "--accent": f.accent }}
                onClick={() => setFocus(i)} onFocus={() => setFocus(i)} onPointerMove={glow}>
                <div className="fan-spot" aria-hidden="true" />
                <div className="fan-top">
                  <span className="feature-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d={f.path} /></svg>
                  </span>
                  <span className="feature-tag">{f.tag}</span>
                </div>
                <div className="fan-body">
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              </article>
            );
          })}
        </div>
        <div className="fan-dots" role="tablist" aria-label="Choose module">
          {features.map((f, i) => (
            <button key={f.title} role="tab" aria-selected={i === focus} aria-label={f.title}
              className={i === focus ? "on" : ""} onClick={() => setFocus(i)} />
          ))}
        </div>
        <p className="fan-hint">Click a card to pull it forward</p>
      </div>

      <aside className="fs-side fs-right">
        <p className="fs-label">What it produces</p>
        <ul className="fs-out" key={focus}>
          {OUTPUTS[focus].map(([t, d], k) => (
            <li key={t} style={{ "--k": k }}><b>{t}</b><span>{d}</span></li>
          ))}
        </ul>
        <div className="fs-nav">
          <button aria-label="Previous module" disabled={focus === 0} onClick={() => go(-1)}><Chevron dir="l" /></button>
          <button aria-label="Next module" disabled={focus === n - 1} onClick={() => go(1)}><Chevron dir="r" /></button>
        </div>
      </aside>
    </div>
  );
}
