import { useEffect, useRef, useState } from "react";

export default function FocusReveal({ text, hint, start = 0 }) {
  const words = text.split(" ");
  const [idx, setIdx] = useState(start);
  const box = useRef(null);
  const frame = useRef(null);
  const refs = useRef([]);
  const paused = useRef(false);

  // Measure the active word and stretch the frame into its box
  useEffect(() => {
    const place = () => {
      const w = refs.current[idx], b = box.current, f = frame.current;
      if (!w || !b || !f) return;
      const wb = w.getBoundingClientRect(), bb = b.getBoundingClientRect(), pad = 10;
      f.style.width = `${wb.width + pad * 2}px`;
      f.style.height = `${wb.height * 0.82 + pad * 2}px`;
      f.style.transform = `translate(${wb.left - bb.left - pad}px, ${wb.top - bb.top + wb.height * 0.09 - pad}px)`;
    };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [idx]);

  // Gentle auto-tour until the visitor takes over
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => { if (!paused.current) setIdx((i) => (i + 1) % words.length); }, 1900);
    return () => clearInterval(id);
  }, [words.length]);

  return (
    <div className="focus-box" ref={box}
      onPointerEnter={() => { paused.current = true; }}
      onPointerLeave={() => { paused.current = false; }}>
      <h2 className="focus-title" aria-label={text}>
        {words.map((w, i) => (
          <span key={i} aria-hidden="true" tabIndex={0} ref={(el) => { refs.current[i] = el; }}
            className={`fw ${i === idx ? "is-sharp" : ""}`}
            onPointerEnter={() => setIdx(i)} onFocus={() => setIdx(i)}>{w}</span>
        ))}
      </h2>
      <span ref={frame} className="focus-frame" aria-hidden="true"><i /><i /><i /><i /></span>
      <p className="focus-hint">{hint}</p>
    </div>
  );
}
