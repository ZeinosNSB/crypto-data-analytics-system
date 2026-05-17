import type { Time } from 'lightweight-charts'

export function formatCurrency(num: number, decimals: number = 2): string {
  if (isNaN(num)) return '0.00'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
}

export function toChartTime(timestampMs: number): Time {
  return Math.floor(timestampMs / 1000) as Time
}
