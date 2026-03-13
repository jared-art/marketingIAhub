'use client'

import { useEffect, useState } from 'react'
import type { AnalysisInsight } from '@/types'

interface HealthScoreGaugeProps {
  insights: AnalysisInsight[]
}

function computeScore(insights: AnalysisInsight[]): number {
  let score = 100
  insights.forEach((insight) => {
    if (insight.severity === 'critical') score -= 20
    else if (insight.severity === 'warning') score -= 10
    else if (insight.severity === 'info') score -= 2
  })
  return Math.max(0, Math.min(100, score))
}

function getGrade(score: number): string {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 50) return 'C'
  if (score >= 30) return 'D'
  return 'F'
}

function getColor(score: number): { stroke: string; text: string; bg: string } {
  if (score >= 70) return { stroke: '#10B981', text: 'text-emerald-400', bg: 'bg-emerald-400/10' }
  if (score >= 50) return { stroke: '#F59E0B', text: 'text-amber-400', bg: 'bg-amber-400/10' }
  if (score >= 30) return { stroke: '#F97316', text: 'text-orange-400', bg: 'bg-orange-400/10' }
  return { stroke: '#EF4444', text: 'text-red-400', bg: 'bg-red-400/10' }
}

function getLabel(score: number): string {
  if (score >= 85) return 'Excelente'
  if (score >= 70) return 'Bueno'
  if (score >= 50) return 'Regular'
  if (score >= 30) return 'Deficiente'
  return 'Crítico'
}

export function HealthScoreGauge({ insights }: HealthScoreGaugeProps) {
  const score = computeScore(insights)
  const grade = getGrade(score)
  const colors = getColor(score)
  const label = getLabel(score)
  const [animatedScore, setAnimatedScore] = useState(0)

  // SVG gauge parameters
  const size = 180
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = Math.PI * radius // semicircle

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score)
    }, 100)
    return () => clearTimeout(timer)
  }, [score])

  const dashOffset = circumference - (animatedScore / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      {/* SVG Gauge */}
      <div className="relative" style={{ width: size, height: size / 2 + 30 }}>
        <svg
          width={size}
          height={size / 2 + strokeWidth}
          viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
        >
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#1F2937"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Animated fill arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 1.5s ease-out',
            }}
          />
        </svg>

        {/* Score display */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <div className={`text-4xl font-bold ${colors.text}`}>{score}</div>
          <div className="text-gray-500 text-xs mt-0.5">/ 100</div>
        </div>
      </div>

      {/* Grade badge */}
      <div className={`mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${colors.bg} border border-current/20`}>
        <span className={`text-2xl font-bold ${colors.text}`}>{grade}</span>
        <span className={`text-sm font-medium ${colors.text}`}>{label}</span>
      </div>

      {/* Insight breakdown */}
      <div className="mt-4 flex gap-4 text-xs text-center">
        <div>
          <div className="text-red-400 font-bold text-base">
            {insights.filter((i) => i.severity === 'critical').length}
          </div>
          <div className="text-gray-500">Críticos</div>
        </div>
        <div className="w-px bg-[#1F2937]" />
        <div>
          <div className="text-amber-400 font-bold text-base">
            {insights.filter((i) => i.severity === 'warning').length}
          </div>
          <div className="text-gray-500">Avisos</div>
        </div>
        <div className="w-px bg-[#1F2937]" />
        <div>
          <div className="text-emerald-400 font-bold text-base">
            {insights.filter((i) => i.type === 'opportunity').length}
          </div>
          <div className="text-gray-500">Oportunidades</div>
        </div>
      </div>
    </div>
  )
}
