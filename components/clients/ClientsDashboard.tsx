'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Analysis, AnalysisConnection, AnalysisResult } from '@/types'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils/formatters'

interface AnalysisWithConnections extends Analysis {
  analysis_connections: AnalysisConnection[]
}

interface GoalData {
  leads_goal: number | null
  conversion_goal: number | null
  revenue_goal: number | null
}

interface HubSpotSummaryData {
  totalLeads: number
  totalDeals: number
  closedDeals: number
  totalRevenue: number
  totalPipeline: number
  conversionRate: number
  avgDealValue: number
}

interface PlatformSummaryData {
  spend: number
  revenue: number
  roas: number
  conversions: number
}

interface ClientMetrics {
  analysisId: string
  clientName: string
  analysisName: string
  dateStart: string
  dateEnd: string
  hubspot: HubSpotSummaryData | null
  meta: PlatformSummaryData | null
  google: PlatformSummaryData | null
  totalSpend: number
  adRevenue: number
  combinedRoas: number
}

function buildClientMetrics(
  analysis: AnalysisWithConnections,
  clientName: string | null,
  results: AnalysisResult[]
): ClientMetrics {
  const ar = results.filter((r) => r.analysis_id === analysis.id)

  const hubspot =
    (ar.find((r) => r.platform === 'hubspot')?.raw_data as { summary?: HubSpotSummaryData })
      ?.summary ?? null
  const meta =
    (ar.find((r) => r.platform === 'meta')?.raw_data as { summary?: PlatformSummaryData })
      ?.summary ?? null
  const google =
    (ar.find((r) => r.platform === 'google_ads')?.raw_data as { summary?: PlatformSummaryData })
      ?.summary ?? null

  const totalSpend = (meta?.spend || 0) + (google?.spend || 0)
  const adRevenue = (meta?.revenue || 0) + (google?.revenue || 0)
  const combinedRoas = totalSpend > 0 ? adRevenue / totalSpend : 0

  return {
    analysisId: analysis.id,
    clientName: clientName || analysis.name,
    analysisName: analysis.name,
    dateStart: analysis.date_range_start,
    dateEnd: analysis.date_range_end,
    hubspot,
    meta,
    google,
    totalSpend,
    adRevenue,
    combinedRoas,
  }
}

// ── Progress bar helpers ─────────────────────────────────────────────────

function progressColor(pct: number) {
  if (pct >= 90) return 'bg-emerald-500'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-red-500'
}

function textColor(pct: number) {
  if (pct >= 90) return 'text-emerald-400'
  if (pct >= 70) return 'text-amber-400'
  return 'text-red-400'
}

function GoalBar({
  label,
  actual,
  goal,
  format,
}: {
  label: string
  actual: number
  goal: number
  format: (v: number) => string
}) {
  const pct = Math.min((actual / goal) * 100, 100)
  const overAchieved = actual >= goal

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className={overAchieved ? 'text-emerald-400 font-medium' : 'text-gray-400'}>
          {format(actual)}{' '}
          <span className="text-gray-600">/ {format(goal)}</span>
          {overAchieved && <span className="ml-1 text-emerald-500">✓</span>}
        </span>
      </div>
      <div className="h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${progressColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={`text-xs font-medium ${textColor(pct)}`}>{pct.toFixed(0)}%</div>
    </div>
  )
}

// ── Goals edit form ──────────────────────────────────────────────────────

function GoalsForm({
  analysisId,
  current,
  onSave,
  onCancel,
}: {
  analysisId: string
  current: GoalData
  onSave: (goal: GoalData) => void
  onCancel: () => void
}) {
  const [leads, setLeads] = useState(current.leads_goal?.toString() || '')
  const [conversion, setConversion] = useState(current.conversion_goal?.toString() || '')
  const [revenue, setRevenue] = useState(current.revenue_goal?.toString() || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload: GoalData = {
        leads_goal: leads ? parseInt(leads) : null,
        conversion_goal: conversion ? parseFloat(conversion) : null,
        revenue_goal: revenue ? parseFloat(revenue) : null,
      }

      const res = await fetch('/api/clients/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: analysisId, ...payload }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Error ${res.status}`)
      }
      onSave(payload)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-[#1F2937] space-y-3">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Objetivos del período</p>

      <div className="grid grid-cols-1 gap-2">
        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-24 flex-shrink-0">Leads objetivo</span>
          <div className="flex items-center gap-1 flex-1">
            <input
              type="number"
              min="0"
              value={leads}
              onChange={(e) => setLeads(e.target.value)}
              placeholder="—"
              className="w-full bg-[#0A0F1E] border border-[#1F2937] focus:border-indigo-500/50 rounded-md px-2 py-1 text-white text-xs focus:outline-none"
            />
            <span className="text-gray-600 text-xs">leads</span>
          </div>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-24 flex-shrink-0">Conversión</span>
          <div className="flex items-center gap-1 flex-1">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={conversion}
              onChange={(e) => setConversion(e.target.value)}
              placeholder="—"
              className="w-full bg-[#0A0F1E] border border-[#1F2937] focus:border-indigo-500/50 rounded-md px-2 py-1 text-white text-xs focus:outline-none"
            />
            <span className="text-gray-600 text-xs">%</span>
          </div>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-24 flex-shrink-0">Facturación</span>
          <div className="flex items-center gap-1 flex-1">
            <input
              type="number"
              min="0"
              step="100"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              placeholder="—"
              className="w-full bg-[#0A0F1E] border border-[#1F2937] focus:border-indigo-500/50 rounded-md px-2 py-1 text-white text-xs focus:outline-none"
            />
            <span className="text-gray-600 text-xs">€</span>
          </div>
        </label>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-md transition-colors"
        >
          {saving ? 'Guardando…' : 'Guardar objetivos'}
        </button>
        <button
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-white px-2 py-1.5 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Client card ──────────────────────────────────────────────────────────

function ClientCard({
  metrics: c,
  initialGoal,
}: {
  metrics: ClientMetrics
  initialGoal: GoalData
}) {
  const [goal, setGoal] = useState<GoalData>(initialGoal)
  const [editing, setEditing] = useState(false)
  const noData = !c.hubspot && !c.meta && !c.google
  const hasGoals = goal.leads_goal || goal.conversion_goal || goal.revenue_goal

  return (
    <div className="bg-[#111827] border border-[#1F2937] hover:border-indigo-500/20 rounded-xl p-4 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <Link
            href={`/analyses/${c.analysisId}`}
            className="text-white font-semibold text-sm hover:text-indigo-300 transition-colors"
          >
            {c.clientName}
          </Link>
          {c.clientName !== c.analysisName && (
            <div className="text-gray-600 text-xs mt-0.5">{c.analysisName}</div>
          )}
          <div className="text-gray-600 text-xs mt-1">
            {new Date(c.dateStart).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
            {' — '}
            {new Date(c.dateEnd).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={`text-xs px-2 py-1 rounded-md border transition-colors flex-shrink-0 ${
            hasGoals
              ? 'text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60'
              : 'text-gray-500 border-[#1F2937] hover:border-indigo-500/30 hover:text-indigo-400'
          }`}
        >
          {hasGoals ? 'Editar objetivos' : '+ Objetivos'}
        </button>
      </div>

      {/* Metrics */}
      {noData ? (
        <div className="text-gray-600 text-xs py-3 text-center border border-dashed border-[#1F2937] rounded-lg">
          Sin datos — ejecuta el análisis
        </div>
      ) : (
        <div className="space-y-2">
          {/* Goal bars — only shown if goals are set AND we have actual data */}
          {c.hubspot && hasGoals && (
            <div className="bg-[#0A0F1E] rounded-lg p-3 space-y-3">
              {goal.leads_goal != null && (
                <GoalBar
                  label="Leads"
                  actual={c.hubspot.totalLeads}
                  goal={goal.leads_goal}
                  format={formatNumber}
                />
              )}
              {goal.conversion_goal != null && (
                <GoalBar
                  label="Conversión"
                  actual={c.hubspot.conversionRate}
                  goal={goal.conversion_goal}
                  format={(v) => `${v.toFixed(1)}%`}
                />
              )}
              {goal.revenue_goal != null && (
                <GoalBar
                  label="Facturación"
                  actual={c.hubspot.totalRevenue}
                  goal={goal.revenue_goal}
                  format={formatCurrency}
                />
              )}
            </div>
          )}

          {/* Raw metrics */}
          {c.hubspot && (
            <div className="grid grid-cols-3 gap-2">
              <MiniStat
                label="Leads"
                value={formatNumber(c.hubspot.totalLeads)}
                color="text-blue-400"
              />
              <MiniStat
                label="Deals"
                value={formatNumber(c.hubspot.closedDeals)}
                color="text-emerald-400"
              />
              <MiniStat
                label="Conv."
                value={formatPercent(c.hubspot.conversionRate)}
                color={c.hubspot.conversionRate >= 5 ? 'text-emerald-400' : 'text-amber-400'}
              />
            </div>
          )}

          {c.hubspot && c.hubspot.totalRevenue > 0 && (
            <div className="flex items-center justify-between bg-[#0A0F1E] rounded-lg px-3 py-2">
              <span className="text-gray-500 text-xs">Revenue cerrado</span>
              <span className="text-emerald-400 font-bold text-sm">
                {formatCurrency(c.hubspot.totalRevenue)}
              </span>
            </div>
          )}

          {c.totalSpend > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0A0F1E] rounded-lg px-3 py-2">
                <div className="text-gray-500 text-xs">Inversión ads</div>
                <div className="text-white font-medium text-sm">{formatCurrency(c.totalSpend)}</div>
              </div>
              <div className="bg-[#0A0F1E] rounded-lg px-3 py-2">
                <div className="text-gray-500 text-xs">ROAS</div>
                <div
                  className={`font-medium text-sm ${
                    c.combinedRoas >= 3
                      ? 'text-emerald-400'
                      : c.combinedRoas >= 1.5
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {c.combinedRoas > 0 ? `${c.combinedRoas.toFixed(1)}x` : '—'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Goals edit form */}
      {editing && (
        <GoalsForm
          analysisId={c.analysisId}
          current={goal}
          onSave={(saved) => {
            setGoal(saved)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#0A0F1E] rounded-lg px-2 py-1.5 text-center">
      <div className="text-gray-600 text-xs">{label}</div>
      <div className={`font-bold text-sm ${color}`}>{value}</div>
    </div>
  )
}

// ── Main dashboard ───────────────────────────────────────────────────────

interface ClientsDashboardProps {
  clientAnalyses: AnalysisWithConnections[]
  clientMap: Record<string, string | null>
  results: AnalysisResult[]
  goalsMap: Record<string, GoalData>
}

export function ClientsDashboard({
  clientAnalyses,
  clientMap,
  results,
  goalsMap,
}: ClientsDashboardProps) {
  const metrics = clientAnalyses.map((a) =>
    buildClientMetrics(a, clientMap[a.id] ?? null, results)
  )

  const totals = metrics.reduce(
    (acc, c) => ({
      leads: acc.leads + (c.hubspot?.totalLeads || 0),
      closedDeals: acc.closedDeals + (c.hubspot?.closedDeals || 0),
      revenue: acc.revenue + (c.hubspot?.totalRevenue || 0),
      spend: acc.spend + c.totalSpend,
      adRevenue: acc.adRevenue + c.adRevenue,
    }),
    { leads: 0, closedDeals: 0, revenue: 0, spend: 0, adRevenue: 0 }
  )

  // Aggregate goals for totals bar
  const totalGoals = Object.values(goalsMap).reduce(
    (acc, g) => ({
      leads: acc.leads + (g.leads_goal || 0),
      revenue: acc.revenue + (g.revenue_goal || 0),
    }),
    { leads: 0, revenue: 0 }
  )

  const totalsRoas = totals.spend > 0 ? totals.adRevenue / totals.spend : 0

  if (clientAnalyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-white font-semibold mb-2">No hay clientes activos</p>
        <p className="text-gray-400 text-sm">
          Marca análisis como clientes en la pestaña &quot;Gestionar&quot; para ver el dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Totals bar */}
      <div className="bg-[#111827] border border-indigo-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-indigo-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">
            Totales — {clientAnalyses.length} cliente{clientAnalyses.length !== 1 ? 's' : ''}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          <TotalCard
            label="Leads totales"
            value={formatNumber(totals.leads)}
            goal={totalGoals.leads > 0 ? formatNumber(totalGoals.leads) : undefined}
            pct={totalGoals.leads > 0 ? (totals.leads / totalGoals.leads) * 100 : undefined}
          />
          <TotalCard label="Deals ganados" value={formatNumber(totals.closedDeals)} />
          <TotalCard
            label="Revenue (CRM)"
            value={formatCurrency(totals.revenue)}
            goal={totalGoals.revenue > 0 ? formatCurrency(totalGoals.revenue) : undefined}
            pct={totalGoals.revenue > 0 ? (totals.revenue / totalGoals.revenue) * 100 : undefined}
            highlight={totals.revenue > 0 ? 'good' : 'neutral'}
          />
          <TotalCard label="Inversión ads" value={formatCurrency(totals.spend)} />
          <TotalCard
            label="ROAS combinado"
            value={totalsRoas > 0 ? `${totalsRoas.toFixed(1)}x` : '—'}
            highlight={totalsRoas >= 3 ? 'good' : totalsRoas >= 1.5 ? 'neutral' : totalsRoas > 0 ? 'bad' : 'neutral'}
          />
        </div>

        {/* Aggregate progress bars */}
        {(totalGoals.leads > 0 || totalGoals.revenue > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#1F2937]">
            {totalGoals.leads > 0 && (
              <GoalBar
                label="Leads vs objetivo global"
                actual={totals.leads}
                goal={totalGoals.leads}
                format={formatNumber}
              />
            )}
            {totalGoals.revenue > 0 && (
              <GoalBar
                label="Facturación vs objetivo global"
                actual={totals.revenue}
                goal={totalGoals.revenue}
                format={formatCurrency}
              />
            )}
          </div>
        )}
      </div>

      {/* Per-client grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {metrics.map((c) => (
          <ClientCard
            key={c.analysisId}
            metrics={c}
            initialGoal={goalsMap[c.analysisId] || { leads_goal: null, conversion_goal: null, revenue_goal: null }}
          />
        ))}
      </div>
    </div>
  )
}

function TotalCard({
  label,
  value,
  goal,
  pct,
  highlight,
}: {
  label: string
  value: string
  goal?: string
  pct?: number
  highlight?: 'good' | 'bad' | 'neutral'
}) {
  const valueColor =
    highlight === 'good'
      ? 'text-emerald-400'
      : highlight === 'bad'
      ? 'text-red-400'
      : 'text-white'

  return (
    <div className="bg-[#0A0F1E] border border-[#1F2937] rounded-lg p-3">
      <div className="text-gray-500 text-xs mb-1">{label}</div>
      <div className={`font-bold text-lg leading-tight ${valueColor}`}>{value}</div>
      {goal && pct != null && (
        <>
          <div className="text-gray-600 text-xs mt-1">obj. {goal}</div>
          <div className="mt-1.5 h-1 bg-[#1F2937] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${progressColor(pct)}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </>
      )}
    </div>
  )
}
