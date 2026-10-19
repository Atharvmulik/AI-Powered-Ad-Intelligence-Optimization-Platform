import { useEffect, useRef } from "react";

export default function EyeButton({ children, onClick, className = "" }) {
  const btn = useRef(null);
  const eyes = useRef([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, mx = 0, my = 0, blinkT = 0, openT = 0;

    const apply = () => {
      raf = 0;
      eyes.current.forEach((eye) => {
        if (!eye) return;
        const b = eye.getBoundingClientRect();
        const dx = mx - (b.left + b.width / 2), dy = my - (b.top + b.height / 2);
        const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 90);
        eye.firstChild.style.transform = `translate(${((dx / d) * 4.2 * k).toFixed(2)}px, ${((dy / d) * 2.6 * k).toFixed(2)}px)`;
      });
    };
    const onMove = (e) => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(apply); };

    const scheduleBlink = () => {
      blinkT = window.setTimeout(() => {
        btn.current?.classList.add("blink");
        openT = window.setTimeout(() => { btn.current?.classList.remove("blink"); scheduleBlink(); }, 150);
      }, 1800 + Math.random() * 3600);
    };
    scheduleBlink();

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      clearTimeout(blinkT); clearTimeout(openT);
    };
  }, []);

  return (
    <button ref={btn} className={`eye-btn ${className}`} onClick={onClick}>
      <span className="eye-label">{children}</span>
      <span className="eyes" aria-hidden="true">
        {[0, 1].map((i) => (
          <span key={i} className="eye" ref={(el) => { eyes.current[i] = el; }}><i className="pupil" /></span>
        ))}
      </span>
    </button>
  );
}
