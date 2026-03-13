'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ChartDataPoint {
  name: string
  spend: number
  conversions: number
}

interface SpendVsConversionsProps {
  data: ChartDataPoint[]
  currency?: string
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-2 font-medium truncate max-w-[150px]">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-400">{entry.name}:</span>
            <span className="text-white font-medium">
              {entry.name === 'Inversión' ? `€${entry.value.toFixed(0)}` : entry.value.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function SpendVsConversions({ data, currency = 'EUR' }: SpendVsConversionsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No hay datos disponibles
      </div>
    )
  }

  const displayData = data.slice(0, 10).map((d) => ({
    ...d,
    name: d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={displayData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
        <XAxis
          dataKey="name"
          tick={{ fill: '#6B7280', fontSize: 10 }}
          axisLine={{ stroke: '#1F2937' }}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: '#6B7280', fontSize: 10 }}
          axisLine={{ stroke: '#1F2937' }}
          tickLine={false}
          tickFormatter={(value) => `€${value}`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: '#6B7280', fontSize: 10 }}
          axisLine={{ stroke: '#1F2937' }}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '11px', color: '#9CA3AF', paddingTop: '8px' }}
        />
        <Bar
          yAxisId="left"
          dataKey="spend"
          name="Inversión"
          fill="#6366F1"
          radius={[3, 3, 0, 0]}
          fillOpacity={0.85}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="conversions"
          name="Conversiones"
          stroke="#10B981"
          strokeWidth={2}
          dot={{ fill: '#10B981', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
