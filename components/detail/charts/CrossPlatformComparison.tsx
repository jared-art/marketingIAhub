'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ComparisonData {
  metric: string
  meta: number
  google: number
}

interface CrossPlatformComparisonProps {
  metaSummary?: {
    spend: number
    cpa: number
    roas: number
    ctr: number
    conversions: number
  }
  googleSummary?: {
    spend: number
    cpa: number
    roas: number
    ctr: number
    conversions: number
  }
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-400">{entry.name}:</span>
            <span className="text-white font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function CrossPlatformComparison({ metaSummary, googleSummary }: CrossPlatformComparisonProps) {
  const data: ComparisonData[] = [
    {
      metric: 'Inversión (€)',
      meta: Math.round(metaSummary?.spend || 0),
      google: Math.round(googleSummary?.spend || 0),
    },
    {
      metric: 'CPA (€)',
      meta: Math.round(metaSummary?.cpa || 0),
      google: Math.round(googleSummary?.cpa || 0),
    },
    {
      metric: 'ROAS (x)',
      meta: parseFloat((metaSummary?.roas || 0).toFixed(2)),
      google: parseFloat((googleSummary?.roas || 0).toFixed(2)),
    },
    {
      metric: 'CTR (%)',
      meta: parseFloat((metaSummary?.ctr || 0).toFixed(2)),
      google: parseFloat((googleSummary?.ctr || 0).toFixed(2)),
    },
    {
      metric: 'Conversiones',
      meta: Math.round(metaSummary?.conversions || 0),
      google: Math.round(googleSummary?.conversions || 0),
    },
  ]

  if (!metaSummary && !googleSummary) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No hay datos de múltiples plataformas para comparar
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
          <XAxis
            dataKey="metric"
            tick={{ fill: '#6B7280', fontSize: 10 }}
            axisLine={{ stroke: '#1F2937' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6B7280', fontSize: 10 }}
            axisLine={{ stroke: '#1F2937' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#9CA3AF', paddingTop: '8px' }}
          />
          {metaSummary && (
            <Bar
              dataKey="meta"
              name="Meta Ads"
              fill="#1877F2"
              radius={[3, 3, 0, 0]}
              fillOpacity={0.85}
            />
          )}
          {googleSummary && (
            <Bar
              dataKey="google"
              name="Google Ads"
              fill="#4285F4"
              radius={[3, 3, 0, 0]}
              fillOpacity={0.85}
            />
          )}
        </BarChart>
      </ResponsiveContainer>

      {/* Summary comparison table */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div />
        {metaSummary && (
          <div className="text-center">
            <div className="text-[#1877F2] font-medium text-xs mb-1">Meta Ads</div>
          </div>
        )}
        {googleSummary && (
          <div className="text-center">
            <div className="text-[#4285F4] font-medium text-xs mb-1">Google Ads</div>
          </div>
        )}

        {[
          { label: 'Inversión', meta: `€${Math.round(metaSummary?.spend || 0)}`, google: `€${Math.round(googleSummary?.spend || 0)}` },
          { label: 'ROAS', meta: `${(metaSummary?.roas || 0).toFixed(1)}x`, google: `${(googleSummary?.roas || 0).toFixed(1)}x` },
          { label: 'CPA', meta: `€${Math.round(metaSummary?.cpa || 0)}`, google: `€${Math.round(googleSummary?.cpa || 0)}` },
        ].map((row) => (
          <div key={row.label} className="contents">
            <div className="text-gray-500 text-xs flex items-center">{row.label}</div>
            {metaSummary && <div className="text-center text-white text-xs font-medium">{row.meta}</div>}
            {googleSummary && <div className="text-center text-white text-xs font-medium">{row.google}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
