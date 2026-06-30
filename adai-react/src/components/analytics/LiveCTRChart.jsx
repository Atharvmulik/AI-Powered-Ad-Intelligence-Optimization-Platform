// src/components/analytics/LiveCTRChart.jsx
// Custom SVG line chart — rolling CTR window with area fill, target line, grid.
// Props: dataPoints — array of { value: number, time: string }

export default function LiveCTRChart({ dataPoints }) {
  const W   = 560;
  const H   = 200;
  const PAD = { top: 16, right: 20, bottom: 36, left: 44 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const minY = 1.5;
  const maxY = 3.8;

  const toX = (i) => PAD.left + (i / Math.max(dataPoints.length - 1, 1)) * chartW;
  const toY = (v) => PAD.top + chartH - ((v - minY) / (maxY - minY)) * chartH;

  const pts     = dataPoints.map((pt, i) => `${toX(i)},${toY(pt.value)}`).join(' ');
  const targetY = toY(2.5);
  const yTicks  = [1.8, 2.2, 2.5, 3.0, 3.4];
  const xLabels = dataPoints
    .map((_, i) => i)
    .filter((i) => i % 5 === 0 || i === dataPoints.length - 1);
  const current = dataPoints[dataPoints.length - 1]?.value || 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={PAD.left} y1={toY(t)} x2={W - PAD.right} y2={toY(t)}
            stroke="#2a2a3a" strokeWidth="1" strokeDasharray="4 4"
          />
          <text x={PAD.left - 6} y={toY(t) + 4} textAnchor="end" fontSize="9" fill="#6b6b8a">
            {t.toFixed(1)}%
          </text>
        </g>
      ))}

      {/* Target dashed line */}
      <line
        x1={PAD.left} y1={targetY} x2={W - PAD.right} y2={targetY}
        stroke="#555577" strokeWidth="1.5" strokeDasharray="6 3"
      />
      <text x={W - PAD.right + 4} y={targetY + 4} fontSize="9" fill="#555577">Target</text>

      {dataPoints.length > 1 && (
        <>
          <defs>
            <linearGradient id="ctrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#571bc1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#571bc1" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <polygon
            points={`${pts} ${toX(dataPoints.length - 1)},${H - PAD.bottom} ${PAD.left},${H - PAD.bottom}`}
            fill="url(#ctrGrad)"
          />

          {/* CTR line */}
          <polyline
            points={pts}
            fill="none"
            stroke="#571bc1"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ transition: 'points 0.5s ease' }}
          />

          {/* Live dot */}
          <circle
            cx={toX(dataPoints.length - 1)}
            cy={toY(current)}
            r="5"
            fill="#571bc1"
            stroke="#c0c1ff"
            strokeWidth="2"
          />
        </>
      )}

      {/* X-axis labels */}
      {xLabels.map((i) => (
        <text key={i} x={toX(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="8" fill="#6b6b8a">
          {new Date(dataPoints[i].time).toLocaleTimeString('en-GB', { hour12: false })}
        </text>
      ))}

      {/* X-axis baseline */}
      <line
        x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom}
        stroke="#2a2a3a" strokeWidth="1"
      />
    </svg>
  );
}