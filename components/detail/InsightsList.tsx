'use client'

import { useState } from 'react'
import type { AnalysisInsight } from '@/types'
import { cn } from '@/lib/utils'
import { getPlatformLabel } from '@/lib/utils/formatters'

interface InsightsListProps {
  insights: AnalysisInsight[]
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical') {
    return (
      <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  }
  if (severity === 'warning') {
    return (
      <svg className="w-4 h-4 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="20,6 9,17 4,12" />
    </svg>
  )
}

function InsightCard({ insight }: { insight: AnalysisInsight }) {
  const [expanded, setExpanded] = useState(false)

  const borderColor = insight.severity === 'critical'
    ? 'border-red-500/20'
    : insight.severity === 'warning'
    ? 'border-amber-500/20'
    : 'border-emerald-500/20'

  const bgColor = insight.severity === 'critical'
    ? 'bg-red-500/5'
    : insight.severity === 'warning'
    ? 'bg-amber-500/5'
    : 'bg-emerald-500/5'

  const platformColors: Record<string, string> = {
    meta: 'text-blue-400 bg-blue-400/10',
    google_ads: 'text-indigo-400 bg-indigo-400/10',
    hubspot: 'text-orange-400 bg-orange-400/10',
    cross_platform: 'text-purple-400 bg-purple-400/10',
  }

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden cursor-pointer transition-all duration-200',
        borderColor,
        bgColor,
        'hover:shadow-sm'
      )}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <SeverityIcon severity={insight.severity} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-white font-medium text-sm leading-snug">{insight.title}</h4>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    platformColors[insight.platform] || 'text-gray-400 bg-gray-400/10'
                  )}
                >
                  {getPlatformLabel(insight.platform)}
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mt-1.5 line-clamp-2">{insight.description}</p>
          </div>
          <svg
            className={cn('w-4 h-4 text-gray-500 flex-shrink-0 transition-transform', expanded ? 'rotate-180' : '')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#1F2937]/50">
          <p className="text-gray-300 text-sm leading-relaxed">{insight.description}</p>

          {(insight.metric_value || insight.metric_benchmark) && (
            <div className="grid grid-cols-2 gap-2">
              {insight.metric_value && (
                <div className="bg-[#0A0F1E] rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">Valor actual</div>
                  <div className="text-white text-xs font-medium">{insight.metric_value}</div>
                </div>
              )}
              {insight.metric_benchmark && (
                <div className="bg-[#0A0F1E] rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">Benchmark</div>
                  <div className="text-white text-xs font-medium">{insight.metric_benchmark}</div>
                </div>
              )}
            </div>
          )}

          {insight.action_recommended && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polygon points="5,3 19,12 5,21 5,3" />
                </svg>
                <div>
                  <div className="text-indigo-300 text-xs font-medium mb-1">Acción recomendada</div>
                  <div className="text-gray-300 text-xs leading-relaxed">{insight.action_recommended}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function InsightsList({ insights }: InsightsListProps) {
  const critical = insights.filter((i) => i.severity === 'critical')
  const warnings = insights.filter((i) => i.severity === 'warning' && i.type !== 'opportunity')
  const opportunities = insights.filter((i) => i.type === 'opportunity')
  const recommendations = insights.filter((i) => i.type === 'recommendation')

  const sections = [
    { title: 'Problemas Críticos', items: critical, color: 'text-red-400', count: critical.length },
    { title: 'Avisos', items: warnings, color: 'text-amber-400', count: warnings.length },
    { title: 'Oportunidades', items: opportunities, color: 'text-emerald-400', count: opportunities.length },
    { title: 'Recomendaciones', items: recommendations, color: 'text-blue-400', count: recommendations.length },
  ].filter((s) => s.items.length > 0)

  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="20,6 9,17 4,12" />
          </svg>
        </div>
        <h3 className="text-white font-medium mb-1">Sin insights generados</h3>
        <p className="text-gray-500 text-sm">Ejecuta el análisis para generar insights automáticos</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="flex items-center gap-2 mb-4">
            <h3 className={`font-semibold text-sm ${section.color}`}>{section.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${section.color} bg-current/10 font-medium`}>
              {section.count}
            </span>
          </div>
          <div className="space-y-2">
            {section.items.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
