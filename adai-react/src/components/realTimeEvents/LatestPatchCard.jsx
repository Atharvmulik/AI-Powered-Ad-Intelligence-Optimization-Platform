// components/realTimeEvents/LatestPatchCard.jsx

import { PATCH_INFO } from '../../constants/realTimeEvents';

/**
 * LatestPatchCard
 * ---------------------------------------------------------------------------
 * Static info card showing the most recently deployed AI patch.
 *
 * @param {string} [version] - defaults to PATCH_INFO.version
 * @param {number} [deployedMinutesAgo] - defaults to PATCH_INFO.deployedMinutesAgo
 * @param {string} [description] - defaults to PATCH_INFO.description
 */
export default function LatestPatchCard({
  version = PATCH_INFO.version,
  deployedMinutesAgo = PATCH_INFO.deployedMinutesAgo,
  description = PATCH_INFO.description,
}) {
  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex items-center space-x-6">
      <div className="h-16 w-16 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary border border-tertiary/20 shrink-0">
        <span className="material-symbols-outlined text-[32px]">security_update_good</span>
      </div>
      <div>
        <h4 className="font-title-lg text-title-lg text-on-surface">Latest AI Patch</h4>
        <p className="text-sm text-on-surface-variant">
          {version} deployed {deployedMinutesAgo}m ago • {description}
        </p>
      </div>
    </div>
  );
}