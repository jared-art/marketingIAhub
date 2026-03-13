'use client'

import { useState } from 'react'
import type { AnalysisInsight } from '@/types'
import { cn } from '@/lib/utils'
import { getPlatformLabel } from '@/lib/utils/formatters'

interface ActionPlanProps {
  insights: AnalysisInsight[]
}

const impactColors: Record<string, string> = {
  critical: 'text-red-400 bg-red-400/10 border-red-400/20',
  warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  info: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
}

const impactLabels: Record<string, string> = {
  critical: 'Alto impacto',
  warning: 'Medio impacto',
  info: 'Bajo impacto',
}

const platformColors: Record<string, string> = {
  meta: 'text-blue-400 bg-blue-400/10',
  google_ads: 'text-indigo-400 bg-indigo-400/10',
  hubspot: 'text-orange-400 bg-orange-400/10',
  cross_platform: 'text-purple-400 bg-purple-400/10',
}

export function ActionPlan({ insights }: ActionPlanProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  // Sort by severity and filter those with action recommendations
  const sortOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 }
  const actions = insights
    .filter((i) => i.action_recommended)
    .sort((a, b) => (sortOrder[a.severity] || 0) - (sortOrder[b.severity] || 0))
    .slice(0, 10)

  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-500 text-sm">No hay acciones disponibles todavía</p>
      </div>
    )
  }

  const toggleCheck = (id: string) => {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setChecked(next)
  }

  const completedCount = checked.size
  const progress = (completedCount / actions.length) * 100

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-300">Progreso del plan</span>
          <span className="text-sm font-bold text-white">
            {completedCount}/{actions.length} completadas
          </span>
        </div>
        <div className="h-2 bg-[#0A0F1E] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {completedCount === actions.length && (
          <p className="text-emerald-400 text-xs mt-2 text-center font-medium">
            ¡Todas las acciones completadas! Excelente trabajo.
          </p>
        )}
      </div>

      {/* Action items */}
      <div className="space-y-3">
        {actions.map((action, index) => {
          const isChecked = checked.has(action.id)
          return (
            <div
              key={action.id}
              className={cn(
                'border rounded-xl p-4 cursor-pointer transition-all duration-200',
                isChecked
                  ? 'border-[#1F2937] bg-[#0A0F1E] opacity-60'
                  : action.severity === 'critical'
                  ? 'border-red-500/20 bg-red-500/5 hover:border-red-500/40'
                  : action.severity === 'warning'
                  ? 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40'
                  : 'border-[#1F2937] bg-[#111827] hover:border-indigo-500/30'
              )}
              onClick={() => toggleCheck(action.id)}
            >
              <div className="flex items-start gap-3">
                {/* Number + Checkbox */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                      isChecked
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-[#374151] text-gray-500'
                    )}
                  >
                    {isChecked ? (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4
                      className={cn(
                        'text-sm font-medium',
                        isChecked ? 'line-through text-gray-500' : 'text-white'
                      )}
                    >
                      {action.title}
                    </h4>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium border',
                        impactColors[action.severity]
                      )}
                    >
                      {impactLabels[action.severity]}
                    </span>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        platformColors[action.platform] || 'text-gray-400 bg-gray-400/10'
                      )}
                    >
                      {getPlatformLabel(action.platform)}
                    </span>
                  </div>

                  {/* Action */}
                  {action.action_recommended && (
                    <p className="text-gray-400 text-xs leading-relaxed">
                      {action.action_recommended}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-gray-600 text-xs text-center">
        Haz click en cada acción para marcarla como completada
      </p>
    </div>
  )
}
