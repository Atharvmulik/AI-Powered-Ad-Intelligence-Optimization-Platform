// src/utils/aiInsightsHelpers.js
// Pure helper functions for the AIInsights page.

// ── SHAP data generators ──────────────────────────────────────────────────────

export const generateShapForUser = (isFraud) => {
  if (isFraud) {
    return {
      isFraud: true,
      features: [
        { feature: 'Click Velocity',  plain: 'Abnormal click speed',          value: parseFloat((0.6  + Math.random() * 0.35).toFixed(2)), positive: false },
        { feature: 'IP Reputation',   plain: 'Suspicious IP address',          value: parseFloat((0.4  + Math.random() * 0.4).toFixed(2)),  positive: false },
        { feature: 'Session Entropy', plain: 'No natural browsing pattern',    value: parseFloat((0.3  + Math.random() * 0.4).toFixed(2)),  positive: false },
        { feature: 'Mouse Movement',  plain: 'No natural mouse movement',      value: parseFloat((0.2  + Math.random() * 0.4).toFixed(2)),  positive: false },
      ],
    }
  }
  return {
    isFraud: false,
    features: [
      { feature: 'User_History_CTR',      plain: 'Interest match',        value: parseFloat((Math.random() * 0.7).toFixed(2)),  positive: Math.random() > 0.3  },
      { feature: 'Ad_Category_Match',     plain: 'Category relevance',    value: parseFloat((Math.random() * 0.55).toFixed(2)), positive: Math.random() > 0.25 },
      { feature: 'Time_of_Day',           plain: 'Timing factor',         value: parseFloat((Math.random() * 0.35).toFixed(2)), positive: Math.random() > 0.5  },
      { feature: 'Device_Type',           plain: 'Device preference',     value: parseFloat((Math.random() * 0.4).toFixed(2)),  positive: Math.random() > 0.4  },
      { feature: 'User_Interest_Vector',  plain: 'Profile similarity',    value: parseFloat((Math.random() * 0.5).toFixed(2)),  positive: Math.random() > 0.3  },
    ],
  }
}

export const generateStreamItemWithShap = () => {
  const userId  = `USER_${Math.floor(1000 + Math.random() * 9000)}`
  const isFraud = Math.random() < 0.15
  const score   = isFraud
    ? parseFloat((0.75 + Math.random() * 0.24).toFixed(2))
    : parseFloat((0.05 + Math.random() * 0.93).toFixed(2))
  const shapData = generateShapForUser(isFraud)
  const time     = new Date().toLocaleTimeString('en-GB', { hour12: false })
  return {
    time,
    user: userId,
    metric: isFraud ? `fraud: ${score} !!` : `p(click): ${score}`,
    isFraud,
    score,
    shapData,
  }
}

// ── Feature subtitle ──────────────────────────────────────────────────────────

export const getFeatureSubtitle = (feature, value, positive) => {
  const absValue = Math.abs(value)
  switch (feature) {
    case 'User_History_CTR':
      return positive
        ? `User clicked ${Math.floor(absValue * 10)} similar ads recently`
        : 'First time seeing this ad category'
    case 'Ad_Category_Match':
      return positive
        ? 'Ad category aligns with browsing history'
        : 'Ad category not in user interest profile'
    case 'Time_of_Day':
      return positive
        ? 'Peak engagement hours for this user'
        : 'Late night — low engagement window'
    case 'Device_Type':
      return positive
        ? 'User most active on this device type'
        : 'User rarely converts on this device'
    case 'Historical_CTR':
      return positive
        ? `This ad has ${(absValue * 5).toFixed(1)}% CTR in similar segments`
        : 'This ad historically underperforms'
    case 'User_Interest_Vector':
      return positive
        ? `${Math.floor(absValue * 100)}% vector similarity to target demographic`
        : 'Low similarity to target demographic'
    default:
      return positive ? 'Strong signal for conversion' : 'Negative signal detected'
  }
}

// ── Impact / threat level badges ──────────────────────────────────────────────

export const getImpactLevel = (value) => {
  const abs = Math.abs(value)
  if (abs > 0.50)  return { label: 'HIGH',   color: 'bg-red-500/20 text-red-500 border-red-500/30'     }
  if (abs >= 0.25) return { label: 'MEDIUM', color: 'bg-amber-500/20 text-amber-500 border-amber-500/30' }
  return             { label: 'LOW',    color: 'bg-green-500/20 text-green-500 border-green-500/30'  }
}

export const getThreatLevel = (value) => {
  const abs = Math.abs(value)
  if (abs > 0.8) return { label: 'CRITICAL', color: 'bg-red-600',    width: '100%' }
  if (abs > 0.6) return { label: 'HIGH',     color: 'bg-red-500',    width: '80%'  }
  if (abs > 0.4) return { label: 'MEDIUM',   color: 'bg-orange-500', width: '60%'  }
  return           { label: 'LOW',      color: 'bg-yellow-500', width: '40%'  }
}

// ── Badge colour helpers ──────────────────────────────────────────────────────

export const getClickProbColor = (prob) => {
  if (prob > 0.7)   return 'bg-green-500/10 text-green-500 border-green-500/20'
  if (prob >= 0.4)  return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  return 'bg-red-500/10 text-red-500 border-red-500/20'
}

export const getFraudRiskColor = (risk) => {
  switch (risk) {
    case 'LOW':    return 'bg-green-500/10 text-green-500 border-green-500/20'
    case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    case 'HIGH':   return 'bg-red-500/10 text-red-500 border-red-500/20'
    default:       return 'bg-surface-container text-on-surface-variant'
  }
}