export function formatCurrency(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value)
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatROAS(value: number): string {
  return `${value.toFixed(2)}x`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    meta: '#1877F2',
    google_ads: '#4285F4',
    hubspot: '#FF7A59',
  }
  return colors[platform] || '#6366F1'
}

export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    meta: 'Meta Ads',
    google_ads: 'Google Ads',
    hubspot: 'HubSpot',
  }
  return labels[platform] || platform
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'text-emerald-400 bg-emerald-400/10',
    running: 'text-blue-400 bg-blue-400/10',
    error: 'text-red-400 bg-red-400/10',
    pending: 'text-gray-400 bg-gray-400/10',
  }
  return colors[status] || 'text-gray-400 bg-gray-400/10'
}
