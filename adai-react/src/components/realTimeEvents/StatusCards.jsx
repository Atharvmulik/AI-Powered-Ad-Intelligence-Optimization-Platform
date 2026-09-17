// components/realTimeEvents/StatusCards.jsx

import { getKafkaStatus } from '../../utils/realTimeEventsHelpers';
import {
  KAFKA_STATUS_TOOLTIP,
  ML_PIPELINE_STATUS,
  FRAUD_ENGINE_STATUS,
  REDIS_CACHE_STATUS,
} from '../../constants/realTimeEvents';

/**
 * StatusCards
 * ---------------------------------------------------------------------------
 * The 4 status badges: Kafka Status (dynamic, derived from eventsPerSec),
 * ML Pipeline, Fraud Engine, and Redis Cache (static).
 *
 * @param {number} eventsPerSec
 */
export default function StatusCards({ eventsPerSec }) {
  const kafkaStatus = getKafkaStatus(eventsPerSec);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-gutter">
      <div
        className={`bg-surface-container-low border ${kafkaStatus.borderColor} rounded-lg px-4 py-2 flex items-center justify-between group relative`}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${kafkaStatus.dotColor} animate-pulse`}></div>
          <span className="text-on-surface-variant font-label-md text-label-md uppercase text-xs">
            Kafka Status
          </span>
        </div>
        <span className={`${kafkaStatus.color} font-mono font-bold text-sm`}>
          {kafkaStatus.text}
        </span>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-highest text-on-surface text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {KAFKA_STATUS_TOOLTIP}
        </div>
      </div>

      <div
        className={`bg-surface-container-low border ${ML_PIPELINE_STATUS.borderColor} rounded-lg px-4 py-2 flex items-center justify-between group relative`}
      >
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${ML_PIPELINE_STATUS.dotColor} ${
              ML_PIPELINE_STATUS.pulse ? 'animate-pulse' : ''
            }`}
          ></div>
          <span className="text-on-surface-variant font-label-md text-label-md uppercase text-xs">
            {ML_PIPELINE_STATUS.label}
          </span>
        </div>
        <span className={`${ML_PIPELINE_STATUS.valueColor} font-mono font-bold text-sm`}>
          {ML_PIPELINE_STATUS.value}
        </span>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-highest text-on-surface text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {ML_PIPELINE_STATUS.tooltip}
        </div>
      </div>

      <div
        className={`bg-surface-container-low border ${FRAUD_ENGINE_STATUS.borderColor} rounded-lg px-4 py-2 flex items-center justify-between group relative`}
      >
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${FRAUD_ENGINE_STATUS.dotColor} ${
              FRAUD_ENGINE_STATUS.pulse ? 'animate-pulse' : ''
            }`}
          ></div>
          <span className="text-on-surface-variant font-label-md text-label-md uppercase text-xs">
            {FRAUD_ENGINE_STATUS.label}
          </span>
        </div>
        <span className={`${FRAUD_ENGINE_STATUS.valueColor} font-mono font-bold text-sm`}>
          {FRAUD_ENGINE_STATUS.value}
        </span>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-highest text-on-surface text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {FRAUD_ENGINE_STATUS.tooltip}
        </div>
      </div>

      <div
        className={`bg-surface-container-low border ${REDIS_CACHE_STATUS.borderColor} rounded-lg px-4 py-2 flex items-center justify-between group relative`}
      >
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${REDIS_CACHE_STATUS.dotColor} ${
              REDIS_CACHE_STATUS.pulse ? 'animate-pulse' : ''
            }`}
          ></div>
          <span className="text-on-surface-variant font-label-md text-label-md uppercase text-xs">
            {REDIS_CACHE_STATUS.label}
          </span>
        </div>
        <span className={`${REDIS_CACHE_STATUS.valueColor} font-mono font-bold text-sm`}>
          {REDIS_CACHE_STATUS.value}
        </span>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-highest text-on-surface text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {REDIS_CACHE_STATUS.tooltip}
        </div>
      </div>
    </div>
  );
}