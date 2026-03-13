'use client'

interface FunnelStage {
  label: string
  value: number
  color: string
}

interface HubSpotFunnelProps {
  summary?: {
    totalLeads: number
    totalDeals: number
    closedDeals: number
    conversionRate: number
  }
}

export function HubSpotFunnel({ summary }: HubSpotFunnelProps) {
  if (!summary) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No hay datos de HubSpot disponibles
      </div>
    )
  }

  const { totalLeads, totalDeals, closedDeals } = summary

  // Estimate MQL and SQL based on typical conversion rates
  const mql = Math.round(totalLeads * 0.4)
  const sql = Math.round(totalLeads * 0.15)

  const stages: FunnelStage[] = [
    { label: 'Leads', value: totalLeads, color: '#6366F1' },
    { label: 'MQL', value: mql, color: '#8B5CF6' },
    { label: 'SQL / Deals', value: totalDeals, color: '#EC4899' },
    { label: 'Clientes', value: closedDeals, color: '#10B981' },
  ]

  const maxValue = stages[0]?.value || 1

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => {
        const pct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0
        const prevValue = index > 0 ? stages[index - 1].value : null
        const stagePct = prevValue && prevValue > 0 ? (stage.value / prevValue) * 100 : null

        return (
          <div key={stage.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">{stage.label}</span>
              <div className="flex items-center gap-3">
                {stagePct !== null && (
                  <span className="text-gray-500">{stagePct.toFixed(0)}% del anterior</span>
                )}
                <span className="text-white font-bold">{stage.value.toLocaleString('es-ES')}</span>
              </div>
            </div>
            <div className="h-8 bg-[#0A0F1E] rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg flex items-center px-3 transition-all duration-1000"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  backgroundColor: stage.color,
                  opacity: 0.85,
                }}
              >
                {pct > 15 && (
                  <span className="text-white text-xs font-medium">
                    {pct.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#1F2937]">
        <div className="text-center">
          <div className="text-white font-bold text-lg">{summary.conversionRate.toFixed(1)}%</div>
          <div className="text-gray-500 text-xs">Conv. global</div>
        </div>
        <div className="text-center">
          <div className="text-white font-bold text-lg">
            {totalLeads > 0 ? ((closedDeals / totalLeads) * 100).toFixed(1) : '0'}%
          </div>
          <div className="text-gray-500 text-xs">Lead → Cliente</div>
        </div>
        <div className="text-center">
          <div className="text-white font-bold text-lg">
            {totalDeals > 0 ? ((closedDeals / totalDeals) * 100).toFixed(0) : '0'}%
          </div>
          <div className="text-gray-500 text-xs">Win rate</div>
        </div>
      </div>
    </div>
  )
}
