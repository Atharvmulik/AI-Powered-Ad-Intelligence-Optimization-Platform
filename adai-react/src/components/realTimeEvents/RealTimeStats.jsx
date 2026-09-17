// components/realTimeEvents/RealTimeStats.jsx

/**
 * RealTimeStats
 * ---------------------------------------------------------------------------
 * The 3 top KPI cards: Events / Second, Total Events (Today), Kafka Latency.
 *
 * @param {number} eventsPerSec
 * @param {number} totalEvents - in millions
 * @param {number} kafkaLatency - in ms
 */
export default function RealTimeStats({ eventsPerSec, totalEvents, kafkaLatency }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
      <div className="bg-surface-container-low border border-outline-variant p-5 rounded-xl">
        <div className="flex justify-between items-start mb-2">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase">
            Events / Second
          </span>
          <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
        </div>
        <div className="flex items-baseline space-x-3">
          <span className="text-display-lg font-black font-mono tracking-tighter leading-none">
            {eventsPerSec}
          </span>
          <span className="text-tertiary font-label-md text-xs font-bold flex items-center">
            <span className="material-symbols-outlined text-[16px] mr-0.5">trending_up</span> +12%
          </span>
        </div>
        <div className="w-full h-1 bg-surface-container-highest mt-4 rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: '72%' }}></div>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant p-5 rounded-xl">
        <div className="flex justify-between items-start mb-2">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase">
            Total Events (Today)
          </span>
          <span className="material-symbols-outlined text-secondary text-[20px]">
            data_thresholding
          </span>
        </div>
        <div className="flex items-baseline space-x-3">
          <span className="text-display-lg font-black font-mono tracking-tighter leading-none">
            {totalEvents}M
          </span>
          <span className="text-on-surface-variant font-label-md text-xs">Target: 100M</span>
        </div>
        <div className="w-full h-1 bg-surface-container-highest mt-4 rounded-full overflow-hidden">
          <div className="h-full bg-secondary" style={{ width: '65%' }}></div>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant p-5 rounded-xl">
        <div className="flex justify-between items-start mb-2">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase">
            Kafka Latency
          </span>
          <span className="material-symbols-outlined text-tertiary text-[20px]">timer</span>
        </div>
        <div className="flex items-baseline space-x-3">
          <span className="text-display-lg font-black font-mono tracking-tighter leading-none">
            {kafkaLatency}
            <small className="text-sm font-normal">ms</small>
          </span>
          <span className="text-error font-label-md text-xs font-bold flex items-center">
            <span className="material-symbols-outlined text-[16px] mr-0.5">warning</span> High
            Load
          </span>
        </div>
        <div className="w-full h-1 bg-surface-container-highest mt-4 rounded-full overflow-hidden">
          <div className="h-full bg-tertiary" style={{ width: '88%' }}></div>
        </div>
      </div>
    </div>
  );
}