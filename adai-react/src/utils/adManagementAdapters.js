// ============================================================
// src/utils/adManagementAdapters.js
// Maps backend response shapes → frontend component prop shapes
// ============================================================

// ---------------------------------------------------------------------------
// Campaign row adapter
// Backend:  { campaign_id, campaign_name, ctr, status, fraud_risk,
//             engagement_pct, thumbnail_url, target_demographics,
//             advertiser_id, ... }
// Frontend: { id, name, subtitle, ctr, status, fraudRisk,
//             engagement, logo }
// ---------------------------------------------------------------------------

export function adaptCampaign(c) {
  return {
    id: String(c.campaign_id),
    name: c.campaign_name,
    subtitle: Array.isArray(c.target_demographics)
      ? c.target_demographics.join(', ')
      : c.advertiser_id,
    ctr: `${Number(c.ctr).toFixed(2)}%`,
    // Backend: ACTIVE/PAUSED/HALTED → Frontend: Active/Paused/Halted
    status:
      c.status.charAt(0).toUpperCase() +
      c.status.slice(1).toLowerCase(),
    fraudRisk: c.fraud_risk,        // Low / Medium / Critical — direct match
    engagement: c.engagement_pct,
    logo: c.thumbnail_url
      ? {
          type: 'image',
          alt: c.campaign_name,
          src: c.thumbnail_url,
          wrapperClass: 'bg-white',
        }
      : {
          type: 'icon',
          icon: 'campaign',
          wrapperClass:
            'bg-surface-container-high border border-outline-variant text-primary',
        },
  }
}

// ---------------------------------------------------------------------------
// Network health adapter
// Backend:  { score, label, narrative }
// Frontend: { score, label, quote, gaugeOffset }
//
// gaugeOffset: 502.65 = full circle (0 score)
// score 92 → offset = 502.65 * (1 - 0.92) = 40.21
// ---------------------------------------------------------------------------

export function adaptNetworkHealth(data) {
  const gaugeOffset = parseFloat(
    (502.65 * (1 - data.score / 100)).toFixed(2)
  )
  return {
    score: data.score,
    label: data.label,
    quote: data.narrative,
    gaugeOffset,
  }
}

// ---------------------------------------------------------------------------
// Optimization feed adapter
// Backend:  { id, title, description, icon_type,
//             recommended_action, priority }
// Frontend: { id, icon, iconColor, title, description,
//             actionLabel, note? }
// ---------------------------------------------------------------------------

const ICON_MAP = {
  audience: { icon: 'groups',    iconColor: 'text-tertiary'   },
  device:   { icon: 'smartphone', iconColor: 'text-green-400' },
  time:     { icon: 'schedule',  iconColor: 'text-blue-400'   },
}

export function adaptOptimizationFeed(items) {
  return items.map((item) => {
    const iconMeta = ICON_MAP[item.icon_type] || {
      icon: 'tips_and_updates',
      iconColor: 'text-primary',
    }

    const adapted = {
      id: item.id,
      icon: iconMeta.icon,
      iconColor: iconMeta.iconColor,
      title: item.title,
      description: item.description,
      actionLabel: item.recommended_action,
    }

    // Prime Time Burst shows a note footer instead of an action button
    if (item.id === 'prime-time-burst') {
      adapted.note = 'Automation scheduled for next cycle.'
      delete adapted.actionLabel
    }

    return adapted
  })
}

// ---------------------------------------------------------------------------
// Global status adapter
// Backend:  { running_pct, paused_pct, expired_pct }
// Frontend: [{ label, percent, dotClass, strokeColor, dashoffset }]
// ---------------------------------------------------------------------------

export function adaptGlobalStatus(data) {
  const runningOffset = parseFloat(
    (251.32 * (1 - data.running_pct / 100)).toFixed(2)
  )
  const pausedOffset = parseFloat(
    (251.32 * (1 - data.paused_pct / 100)).toFixed(2)
  )
  const expiredOffset = parseFloat(
    (251.32 * (1 - data.expired_pct / 100)).toFixed(2)
  )

  return [
    {
      label: 'Running',
      percent: `${Math.round(data.running_pct)}%`,
      dotClass: 'bg-primary',
      strokeColor: '#571bc1',
      dashoffset: runningOffset,
    },
    {
      label: 'Paused',
      percent: `${Math.round(data.paused_pct)}%`,
      dotClass: 'bg-secondary-container',
      strokeColor: '#c0c1ff',
      dashoffset: pausedOffset,
    },
    {
      label: 'Expired',
      percent: `${Math.round(data.expired_pct)}%`,
      dotClass: 'bg-surface-container-highest',
      strokeColor: '#34343c',
      dashoffset: expiredOffset,
    },
  ]
}

// ---------------------------------------------------------------------------
// Analysis log WebSocket message adapter
// Backend:  { log_type, message, timestamp }
// Frontend: { time, type, msg, color }
// ---------------------------------------------------------------------------

export function adaptLogMessage(data) {
  const date = new Date(data.timestamp)
  const time = date.toLocaleTimeString('en-GB', { hour12: false })
  return {
    time,
    type: `${data.log_type}:`,
    msg: data.message,
    color: 'text-on-surface',
  }
}