// components/realTimeEvents/NodesCard.jsx

import { NODES_INFO } from '../../constants/realTimeEvents';

/**
 * NodesCard
 * ---------------------------------------------------------------------------
 * Static info card showing cluster node health summary.
 *
 * @param {number} [healthyNodes] - defaults to NODES_INFO.healthyNodes
 * @param {number} [totalNodes] - defaults to NODES_INFO.totalNodes
 * @param {string} [region] - defaults to NODES_INFO.region
 */
export default function NodesCard({
  healthyNodes = NODES_INFO.healthyNodes,
  totalNodes = NODES_INFO.totalNodes,
  region = NODES_INFO.region,
}) {
  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex items-center space-x-6">
      <div className="h-16 w-16 rounded-full bg-primary-container/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
        <span className="material-symbols-outlined text-[32px]">hub</span>
      </div>
      <div>
        <h4 className="font-title-lg text-title-lg text-on-surface">Nodes Active</h4>
        <p className="text-sm text-on-surface-variant">
          {healthyNodes}/{totalNodes} healthy clusters processing in {region}
        </p>
      </div>
    </div>
  );
}