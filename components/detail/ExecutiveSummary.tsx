'use client'

import type { AnalysisResult, AnalysisInsight } from '@/types'
import { HealthScoreGauge } from './HealthScoreGauge'
import { formatCurrency, formatNumber, formatPercent, formatROAS } from '@/lib/utils/formatters'

interface ExecutiveSummaryProps {
  results: AnalysisResult[]
  insights: AnalysisInsight[]
  dateStart: string
  dateEnd: string
}

interface PlatformSummary {
  spend: number
  revenue: number
  roas: number
  impressions: number
  clicks: number
  conversions: number
  cpa: number
  ctr: number
}

interface HubSpotSummary {
  totalLeads: number
  closedDeals: number
  totalRevenue: number
  conversionRate: number
  avgDealValue: number
}

function extractSummaries(results: AnalysisResult[]) {
  const meta = results.find((r) => r.platform === 'meta' && r.data_type === 'campaigns_summary')
  const google = results.find((r) => r.platform === 'google_ads' && r.data_type === 'campaigns_summary')
  const hubspot = results.find((r) => r.platform === 'hubspot' && r.data_type === 'crm_summary')

  const metaSummary = (meta?.raw_data as { summary?: PlatformSummary })?.summary
  const googleSummary = (google?.raw_data as { summary?: PlatformSummary })?.summary
  const hubspotSummary = (hubspot?.raw_data as { summary?: HubSpotSummary })?.summary

  const totalSpend = (metaSummary?.spend || 0) + (googleSummary?.spend || 0)

  // Prefer HubSpot real revenue (closed deals) over platform-reported revenue
  const hubspotRevenue = hubspotSummary?.totalRevenue || 0
  const adsReportedRevenue = (metaSummary?.revenue || 0) + (googleSummary?.revenue || 0)
  const hasHubspot = !!hubspotSummary
  // Real revenue: HubSpot if available, else ads platforms
  const totalRevenue = hasHubspot ? hubspotRevenue : adsReportedRevenue

  const combinedROAS = totalSpend > 0 && totalRevenue > 0 ? totalRevenue / totalSpend : 0
  const totalLeads = hubspotSummary?.totalLeads || 0
  const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0
  const conversionRate = hubspotSummary?.conversionRate || 0

  return {
    totalSpend,
    totalRevenue,
    adsReportedRevenue,
    hasHubspot,
    combinedROAS,
    totalLeads,
    costPerLead,
    conversionRate,
    metaSummary,
    googleSummary,
    hubspotSummary,
  }
}

export function ExecutiveSummary({ results, insights, dateStart, dateEnd }: ExecutiveSummaryProps) {
  const {
    totalSpend, totalRevenue, adsReportedRevenue, hasHubspot,
    combinedROAS, totalLeads, costPerLead, conversionRate, hubspotSummary,
  } = extractSummaries(results)

  const criticalInsights = insights.filter((i) => i.severity === 'critical').slice(0, 3)

  const kpis = [
    {
      label: 'Inversión total',
      value: formatCurrency(totalSpend),
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" d="M12 6v6l4 2" />
        </svg>
      ),
      color: 'text-indigo-400',
    },
    {
      label: hasHubspot ? 'Revenue cerrado (HubSpot)' : 'Revenue reportado',
      value: totalRevenue > 0 ? formatCurrency(totalRevenue) : 'N/A',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
      color: 'text-emerald-400',
    },
    ...(hasHubspot && adsReportedRevenue > 0 ? [{
      label: 'Revenue plataformas (ads)',
      value: formatCurrency(adsReportedRevenue),
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
        </svg>
      ),
      color: 'text-gray-400',
    }] : []),
    {
      label: hasHubspot ? 'ROAS real (HubSpot)' : 'ROAS combinado',
      value: totalSpend > 0 && totalRevenue > 0 ? formatROAS(combinedROAS) : 'N/A',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: combinedROAS >= 3 ? 'text-emerald-400' : combinedROAS >= 1.5 ? 'text-amber-400' : combinedROAS > 0 ? 'text-red-400' : 'text-gray-400',
    },
    {
      label: 'Leads (HubSpot)',
      value: totalLeads > 0 ? formatNumber(totalLeads) : 'N/A',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'text-blue-400',
    },
    {
      label: 'Coste por lead',
      value: costPerLead > 0 ? formatCurrency(costPerLead) : 'N/A',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-purple-400',
    },
    {
      label: 'Tasa de conversión',
      value: conversionRate > 0 ? formatPercent(conversionRate) : 'N/A',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: conversionRate >= 10 ? 'text-emerald-400' : conversionRate >= 5 ? 'text-amber-400' : 'text-red-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Analysis period */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Período: {new Date(dateStart).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} —{' '}
        {new Date(dateEnd).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gauge */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Salud general</h3>
          <HealthScoreGauge insights={insights} />
        </div>

        {/* KPI grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-[#111827] border border-[#1F2937] rounded-xl p-4"
            >
              <div className={`${kpi.color} mb-2`}>{kpi.icon}</div>
              <div className="text-white font-bold text-xl leading-none mb-1">
                {kpi.value}
              </div>
              <div className="text-gray-500 text-xs">{kpi.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical alerts */}
      {criticalInsights.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-red-400 font-semibold text-sm">
              {criticalInsights.length} alerta{criticalInsights.length !== 1 ? 's' : ''} crítica{criticalInsights.length !== 1 ? 's' : ''}
            </h3>
          </div>
          <div className="space-y-3">
            {criticalInsights.map((insight) => (
              <div key={insight.id} className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <div className="text-red-300 font-medium text-sm">{insight.title}</div>
                <div className="text-gray-400 text-xs mt-1 line-clamp-2">{insight.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
