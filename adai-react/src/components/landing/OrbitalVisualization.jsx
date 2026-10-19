import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;
const LEAF = "224,255,194";
const MINT = "110,231,183";
const CORAL = "255,143,115";

const rotX = ([x, y, z], a) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
const rotY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
const rotZ = ([x, y, z], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];
const orient = (p, ay, ax) => rotX(rotY(p, ay), ax);
const norm = ([x, y, z]) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
const geo = (la, lo) => { const a = (la * Math.PI) / 180, b = (lo * Math.PI) / 180; return [Math.cos(a) * Math.sin(b), -Math.sin(a), Math.cos(a) * Math.cos(b)]; };

function fib(n) {
  const g = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y);
    return [Math.cos(g * i) * r, y, Math.sin(g * i) * r];
  });
}

const RINGS = [
  { r: 1.3, tx: 1.25, tz: 0.25, sp: 0.32, sats: [0, 3.1] },
  { r: 1.45, tx: 0.4, tz: -0.55, sp: -0.22, sats: [1.6] },
  { r: 1.2, tx: 1.0, tz: 1.15, sp: 0.18, sats: [4.4] },
];
const ARCS = [
  { a: [28, 77], b: [40, -74], off: 0, c: LEAF },
  { a: [19, 73], b: [51, 0], off: 0.5, c: MINT },
  { a: [1, 103], b: [35, 139], off: 1.0, c: LEAF },
  { a: [-33, 151], b: [19, 73], off: 0.25, c: CORAL },
  { a: [37, -122], b: [28, 77], off: 0.8, c: MINT },
].map((e) => {
  const A = geo(...e.a), B = geo(...e.b);
  const pts = Array.from({ length: 29 }, (_, i) => {
    const t = i / 28, m = norm([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
    const lift = 1 + 0.28 * Math.sin(Math.PI * t);
    return [m[0] * lift, m[1] * lift, m[2] * lift];
  });
  return { ...e, A, B, pts };
});

const BAR_HEIGHTS = [40, 62, 48, 78, 58, 90];
const RANK_WIDTHS = [92, 71, 54];

export default function OrbitalVisualization() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current, cv = canvasRef.current;
    const ctx = cv.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    const dots = fib(620);
    const grid = [];
    for (let la = -60; la <= 60; la += 30) {
      const y = Math.sin((la * Math.PI) / 180), r = Math.cos((la * Math.PI) / 180);
      grid.push(Array.from({ length: 73 }, (_, i) => [Math.cos((i / 72) * TAU) * r, y, Math.sin((i / 72) * TAU) * r]));
    }
    for (let lo = 0; lo < 180; lo += 30) {
      const c = Math.cos((lo * Math.PI) / 180), s = Math.sin((lo * Math.PI) / 180);
      grid.push(Array.from({ length: 73 }, (_, i) => { const t = (i / 72) * TAU; return [Math.cos(t) * c, Math.sin(t), Math.cos(t) * s]; }));
    }
    const ringBase = RINGS.map((rg) => Array.from({ length: 121 }, (_, i) => {
      const t = (i / 120) * TAU;
      return rotZ(rotX([Math.cos(t) * rg.r, Math.sin(t) * rg.r, 0], rg.tx), rg.tz);
    }));

    let size = 0, dpr = 1, R = 0, cx = 0, cy = 0;
    let spin = 0, speed = 0.18, px = 0, py = 0, tpx = 0, tpy = 0, glow = 0, hover = false;
    let last = performance.now(), t0 = last, raf = 0, visible = true;

    const P = (p) => { const k = 1 / (1 - p[2] * 0.18); return [cx + p[0] * R * k, cy + p[1] * R * k, p[2], k]; };

    const strokeLine = (pts, front, rgb, lo, hi, w) => {
      ctx.lineWidth = w;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], z = (a[2] + b[2]) / 2;
        if ((z >= 0) !== front) continue;
        ctx.strokeStyle = `rgba(${rgb},${lo + hi * Math.abs(z)})`;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
    };

    function draw(now) {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      const time = reduced ? 3 : (now - t0) / 1000;
      if (!reduced) {
        speed += ((hover ? 0.6 : 0.18) - speed) * Math.min(1, dt * 3);
        spin += dt * speed;
        px += (tpx - px) * Math.min(1, dt * 4);
        py += (tpy - py) * Math.min(1, dt * 4);
        glow += ((hover ? 1 : 0) - glow) * Math.min(1, dt * 4);
      }
      const ay = (reduced ? 0.6 : spin) + px, ax = -0.34 + py;
      ctx.clearRect(0, 0, size, size);

      let g = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 2);
      g.addColorStop(0, `rgba(${LEAF},${0.2 + glow * 0.18})`);
      g.addColorStop(0.4, `rgba(19,138,102,${0.16 + glow * 0.1})`);
      g.addColorStop(1, "rgba(6,71,52,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 2, 0, TAU); ctx.fill();

      const ringPts = ringBase.map((base, i) => base.map((p) => P(orient(rotY(p, time * RINGS[i].sp), ay * 0.6, ax))));
      ringPts.forEach((pts) => strokeLine(pts, false, MINT, 0.05, 0.12, 1));

      g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.05);
      g.addColorStop(0, "#0f7a58"); g.addColorStop(0.55, "#064734"); g.addColorStop(1, "#021a12");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(${LEAF},${0.35 + glow * 0.3})`; ctx.lineWidth = 1.2; ctx.stroke();

      grid.forEach((line) => strokeLine(line.map((p) => P(orient(p, ay, ax))), true, LEAF, 0.02, 0.1, 0.8));
      for (const d of dots) {
        const [x, y, z] = P(orient(d, ay, ax));
        if (z < -0.05) continue;
        const s = 1 + z * 0.9;
        ctx.fillStyle = `rgba(${LEAF},${0.15 + 0.75 * z})`;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }

      ARCS.forEach((arc) => {
        const prog = ((time * 0.28 + arc.off) % 1.7) / 1.7;
        const last = arc.pts.length - 1;
        const head = Math.max(0, Math.min(Math.floor(prog * last), last));
        const tail = Math.max(0, head - 14);
        const pts = arc.pts.map((p) => P(orient(p, ay, ax)));
        for (let i = tail; i < head; i++) {
          const a = pts[i], b = pts[i + 1], z = (a[2] + b[2]) / 2;
          if (z < -0.1) continue;
          ctx.strokeStyle = `rgba(${arc.c},${((i - tail) / 14) * (0.4 + 0.6 * Math.max(z, 0))})`;
          ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        }
        [arc.A, arc.B].forEach((e) => {
          const [x, y, z] = P(orient(e, ay, ax));
          if (z < 0) return;
          ctx.strokeStyle = `rgba(${arc.c},${0.5 + 0.4 * Math.sin(time * 3)})`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x, y, 3 + 1.5 * Math.sin(time * 2 + arc.off * 5), 0, TAU); ctx.stroke();
        });
        if (head < last) {
          const [x, y, z] = pts[head];
          if (z > -0.1) { ctx.fillStyle = `rgb(${arc.c})`; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill(); }
        }
      });

      ringPts.forEach((pts) => strokeLine(pts, true, LEAF, 0.2, 0.6, 1.5));
      RINGS.forEach((rg, i) => rg.sats.forEach((s) => {
        const th = s + time * 0.5 * Math.sign(rg.sp);
        const base = rotZ(rotX([Math.cos(th) * rg.r, Math.sin(th) * rg.r, 0], rg.tx), rg.tz);
        const [x, y, z, k] = P(orient(rotY(base, time * rg.sp), ay * 0.6, ax));
        const rad = (3.2 + glow * 1.5) * k, a = z >= 0 ? 1 : 0.35;
        const h = ctx.createRadialGradient(x, y, 0, x, y, rad * 4);
        h.addColorStop(0, `rgba(${i === 1 ? MINT : LEAF},${0.6 * a})`); h.addColorStop(1, "rgba(224,255,194,0)");
        ctx.fillStyle = h; ctx.beginPath(); ctx.arc(x, y, rad * 4, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(255,255,240,${a})`; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
      }));
    }

    const resize = () => {
      size = wrap.clientWidth;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = cv.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = size * 0.255; cx = size / 2; cy = size / 2;
      if (reduced) draw(performance.now());
    };
    const loop = (now) => { draw(now); raf = visible ? requestAnimationFrame(loop) : 0; };
    const start = () => { if (!raf && !reduced) { last = performance.now(); raf = requestAnimationFrame(loop); } };

    const onMove = (e) => {
      const b = wrap.getBoundingClientRect();
      tpx = ((e.clientX - b.left) / b.width - 0.5) * 1.3;
      tpy = ((e.clientY - b.top) / b.height - 0.5) * 0.6;
    };
    const onEnter = () => { hover = true; };
    const onLeave = () => { hover = false; tpx = 0; tpy = 0; };
    if (fine && !reduced) {
      wrap.addEventListener("pointermove", onMove);
      wrap.addEventListener("pointerenter", onEnter);
      wrap.addEventListener("pointerleave", onLeave);
    }
    const ro = new ResizeObserver(resize); ro.observe(wrap);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); });
    io.observe(wrap);
    resize(); start();

    return () => {
      cancelAnimationFrame(raf); raf = 0; visible = false;
      ro.disconnect(); io.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerenter", onEnter);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="orbital-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} className="globe-canvas" aria-hidden="true" />

      <article className="fcard fc-ctr">
        <div className="fc-head">
          <span className="fc-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg></span>
          <div><h3>CTR Prediction</h3><p>MODEL INFERENCE</p></div>
        </div>
        <div className="fc-bars" aria-hidden="true">{BAR_HEIGHTS.map((h, i) => <span key={i} style={{ "--h": `${h}%`, "--i": i }} />)}</div>
        <span className="fc-tag">illustrative</span>
      </article>

      <article className="fcard fc-fraud">
        <div className="fc-head">
          <span className="fc-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.04A11.96 11.96 0 013.6 6 12 12 0 003 9.75c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.3-.2-2.55-.6-3.75-2.3 0-4.4-.9-6-2.29z" /></svg></span>
          <div><h3>Fraud Detection</h3><p>ANOMALY SCORING</p></div>
        </div>
        <div className="fc-chips" aria-hidden="true"><span className="chip chip-ok">● Clean</span><span className="chip chip-bad">▲ Flagged</span></div>
        <span className="fc-tag">illustrative</span>
      </article>

      <article className="fcard fc-rec">
        <div className="fc-head">
          <span className="fc-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M9.8 15.9L9 18.75l-.8-2.85a4.5 4.5 0 00-3.1-3.1L2.25 12l2.85-.8a4.5 4.5 0 003.1-3.1L9 5.25l.8 2.85a4.5 4.5 0 003.1 3.1l2.85.8-2.85.8a4.5 4.5 0 00-3.1 3.1z" /></svg></span>
          <div><h3>Smart Recommendations</h3><p>PERSONALIZED RANKING</p></div>
        </div>
        <div className="fc-rank" aria-hidden="true">{RANK_WIDTHS.map((w, i) => <span key={i} style={{ "--w": `${w}%`, "--i": i }} />)}</div>
        <span className="fc-tag">illustrative</span>
      </article>
    </div>
  );
}