import { useState } from 'react'
import { INITIAL_CITIES_DATA } from '../../constants/mockData'

export default function GeoTrafficMap() {
  const [hoveredCity, setHoveredCity] = useState(null)
  const [citiesData] = useState(INITIAL_CITIES_DATA)

  return (
    <div className="lg:col-span-3 bg-surface-container border border-outline-variant rounded-xl overflow-hidden flex flex-col justify-between group relative">
      <div className="px-6 py-4 border-b border-outline-variant">
        <h3 className="font-title-lg text-title-lg text-on-surface">Geographic Traffic</h3>
      </div>
      <div className="flex-1 relative bg-surface-container-low p-4 overflow-hidden min-h-[220px] flex items-center justify-center">
        {/* Ambient grid bg */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(circle, #c0c1ff 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
        </div>

        {/* India High-Tech Map Layout with pulsing interactive markers */}
        <div className="relative h-full w-full max-w-[200px] aspect-[4/5] flex items-center justify-center">
          {/* Futuristic Vector Representation of India Outline or Nodes Grid */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 select-none pointer-events-none">
            <svg className="w-full h-full text-outline-variant" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M45 5 L55 10 L65 25 L85 30 L80 40 L70 50 L60 65 L55 85 L50 115 L45 85 L35 70 L25 55 L15 45 L10 30 L20 20 L35 15 Z" />
            </svg>
          </div>

          {/* Hotspot Markers (Mumbai, Delhi, Bangalore, Pune, Hyderabad, Chennai) */}
          {/* Mumbai */}
          <button 
            onMouseEnter={() => setHoveredCity('Mumbai')}
            onMouseLeave={() => setHoveredCity(null)}
            className="absolute top-[50%] left-[25%] w-3 h-3 bg-green-400 rounded-full cursor-pointer hover:scale-125 transition-transform shadow-[0_0_8px_#4ade80] z-20 group/marker"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
          </button>

          {/* Delhi */}
          <button 
            onMouseEnter={() => setHoveredCity('Delhi')}
            onMouseLeave={() => setHoveredCity(null)}
            className="absolute top-[25%] left-[45%] w-3.5 h-3.5 bg-error rounded-full cursor-pointer hover:scale-125 transition-transform shadow-[0_0_8px_#ffb4ab] z-20 group/marker"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-60"></span>
          </button>

          {/* Bangalore */}
          <button 
            onMouseEnter={() => setHoveredCity('Bangalore')}
            onMouseLeave={() => setHoveredCity(null)}
            className="absolute top-[70%] left-[38%] w-3 h-3 bg-green-400 rounded-full cursor-pointer hover:scale-125 transition-transform shadow-[0_0_8px_#4ade80] z-20 group/marker"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
          </button>

          {/* Pune */}
          <button 
            onMouseEnter={() => setHoveredCity('Pune')}
            onMouseLeave={() => setHoveredCity(null)}
            className="absolute top-[55%] left-[30%] w-2 h-2 bg-green-400 rounded-full cursor-pointer hover:scale-125 transition-transform shadow-[0_0_6px_#4ade80] z-20 group/marker"
          >
          </button>

          {/* Hyderabad */}
          <button 
            onMouseEnter={() => setHoveredCity('Hyderabad')}
            onMouseLeave={() => setHoveredCity(null)}
            className="absolute top-[60%] left-[45%] w-2.5 h-2.5 bg-green-400 rounded-full cursor-pointer hover:scale-125 transition-transform shadow-[0_0_6px_#4ade80] z-20 group/marker"
          >
          </button>

          {/* Chennai */}
          <button 
            onMouseEnter={() => setHoveredCity('Chennai')}
            onMouseLeave={() => setHoveredCity(null)}
            className="absolute top-[72%] left-[48%] w-2.5 h-2.5 bg-[#ffb783] rounded-full cursor-pointer hover:scale-125 transition-transform shadow-[0_0_6px_#ffb783] z-20 group/marker"
          >
          </button>

          {/* Static Labels overlay */}
          <div className="absolute top-[20%] left-[58%] text-[8px] font-mono font-bold opacity-60 pointer-events-none">Delhi (Hotspot)</div>
          <div className="absolute top-[48%] left-[2%] text-[8px] font-mono font-bold opacity-60 pointer-events-none">Mumbai</div>
          <div className="absolute top-[75%] left-[20%] text-[8px] font-mono font-bold opacity-60 pointer-events-none">BLR</div>
        </div>

        {/* City interactive stats hover tooltip */}
        {hoveredCity && (
          <div className="absolute top-2 left-2 right-2 bg-surface-container-high/95 border border-outline rounded-lg p-2 shadow-2xl z-30 text-[10px] font-mono leading-relaxed">
            <div className="font-extrabold text-xs text-primary mb-1 uppercase tracking-wider">{hoveredCity} Hub</div>
            <div className="flex justify-between"><span>Traffic Vol:</span><span className="font-bold text-on-surface">{citiesData[hoveredCity].traffic}</span></div>
            <div className="flex justify-between"><span>Fraud Rate:</span><span className="font-bold text-error">{citiesData[hoveredCity].fraud}</span></div>
            <div className="flex justify-between"><span>Conv Rate:</span><span className={`font-bold ${citiesData[hoveredCity].color}`}>{citiesData[hoveredCity].conversions}</span></div>
            <div className="flex justify-between border-t border-outline-variant/30 mt-1 pt-1"><span>Top Segment:</span><span className="font-bold text-tertiary">{citiesData[hoveredCity].topCampaign}</span></div>
          </div>
        )}
      </div>

      <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 text-[8px] font-mono uppercase bg-surface-container-high/60 backdrop-blur-sm p-1.5 rounded border border-outline-variant/30 pointer-events-none">
        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> High Conv</div>
        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#ffb783]"></span> Mid</div>
        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-error"></span> Fraud Spill</div>
      </div>
    </div>
  )
}
