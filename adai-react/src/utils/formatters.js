export function formatCurrency(value) {
  if (value === undefined || value === null) return '₹0'
  
  const absValue = Math.abs(value)
  if (absValue >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`
  }
  if (absValue >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value)
}

export function formatNumber(value) {
  if (value === undefined || value === null) return '0'
  return new Intl.NumberFormat('en-IN').format(value)
}

export function formatPercentage(value) {
  if (value === undefined || value === null) return '0.00%'
  return `${Number(value).toFixed(2)}%`
}
