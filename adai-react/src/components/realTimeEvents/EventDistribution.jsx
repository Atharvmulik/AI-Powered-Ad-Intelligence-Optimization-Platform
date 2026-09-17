// components/realTimeEvents/EventDistribution.jsx

import { getEventCounts, getBarHeight } from '../../utils/realTimeEventsHelpers';

/**
 * EventDistribution
 * ---------------------------------------------------------------------------
 * Bar chart card showing the current tally of Clicks / Fraud / Preds / SHAP
 * events within the visible log buffer.
 *
 * @param {Array<{label: string}>} logs
 */
export default function EventDistribution({ logs }) {
  const eventCounts = getEventCounts(logs);
  const maxCount = Math.max(...Object.values(eventCounts), 1);

  return (
    <div className="bg-surface-container-low border border-outline-variant p-5 rounded-xl h-[240px] flex flex-col justify-between">
      <h3 className="font-title-lg text-title-lg mb-4 flex justify-between items-center">
        Event Distribution
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
          pie_chart
        </span>
      </h3>
      <div className="flex-grow flex items-end justify-between space-x-2 px-2 pb-2">
        <div className="flex flex-col items-center flex-1 group">
          <div
            className="w-full bg-primary/20 rounded-t-sm relative transition-all duration-300 group-hover:bg-primary/40"
            style={{ height: '80px' }}
          >
            <div
              className="absolute bottom-0 w-full bg-primary rounded-t-sm shadow-[0_0_15px_rgba(192,193,255,0.4)] transition-all duration-500"
              style={{ height: `${getBarHeight(eventCounts.CLICK, maxCount)}px` }}
            ></div>
          </div>
          <span className="font-label-md text-[10px] mt-2 text-primary font-bold">Clicks</span>
          <span className="text-xs text-on-surface-variant mt-1">{eventCounts.CLICK}</span>
        </div>
        <div className="flex flex-col items-center flex-1 group">
          <div
            className="w-full bg-error/20 rounded-t-sm relative transition-all duration-300 group-hover:bg-error/40"
            style={{ height: '80px' }}
          >
            <div
              className="absolute bottom-0 w-full bg-error rounded-t-sm transition-all duration-500"
              style={{ height: `${getBarHeight(eventCounts.FRAUD, maxCount)}px` }}
            ></div>
          </div>
          <span className="font-label-md text-[10px] mt-2 text-error font-bold">Fraud</span>
          <span className="text-xs text-on-surface-variant mt-1">{eventCounts.FRAUD}</span>
        </div>
        <div className="flex flex-col items-center flex-1 group">
          <div
            className="w-full bg-tertiary/20 rounded-t-sm relative transition-all duration-300 group-hover:bg-tertiary/40"
            style={{ height: '80px' }}
          >
            <div
              className="absolute bottom-0 w-full bg-tertiary rounded-t-sm transition-all duration-500"
              style={{ height: `${getBarHeight(eventCounts.PRED, maxCount)}px` }}
            ></div>
          </div>
          <span className="font-label-md text-[10px] mt-2 text-tertiary font-bold">Preds</span>
          <span className="text-xs text-on-surface-variant mt-1">{eventCounts.PRED}</span>
        </div>
        <div className="flex flex-col items-center flex-1 group">
          <div
            className="w-full bg-yellow-400/20 rounded-t-sm relative transition-all duration-300 group-hover:bg-yellow-400/40"
            style={{ height: '80px' }}
          >
            <div
              className="absolute bottom-0 w-full bg-yellow-400 rounded-t-sm transition-all duration-500"
              style={{ height: `${getBarHeight(eventCounts.SHAP, maxCount)}px` }}
            ></div>
          </div>
          <span className="font-label-md text-[10px] mt-2 text-yellow-400 font-bold">SHAP</span>
          <span className="text-xs text-on-surface-variant mt-1">{eventCounts.SHAP}</span>
        </div>
      </div>
    </div>
  );
}