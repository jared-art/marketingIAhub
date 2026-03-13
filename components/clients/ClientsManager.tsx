'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Analysis, AnalysisConnection, AnalysisResult } from '@/types'
import { ClientsDashboard } from './ClientsDashboard'

interface AnalysisWithConnections extends Analysis {
  analysis_connections: AnalysisConnection[]
}

interface GoalData {
  leads_goal: number | null
  conversion_goal: number | null
  revenue_goal: number | null
}

interface ClientsManagerProps {
  analyses: AnalysisWithConnections[]
  clientMap: Record<string, string | null>
  clientResults: AnalysisResult[]
  goalsMap: Record<string, GoalData>
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  meta: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
    </svg>
  ),
  google_ads: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  ),
  hubspot: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    </svg>
  ),
}

const PLATFORM_COLORS: Record<string, string> = {
  meta: 'text-blue-400',
  google_ads: 'text-green-400',
  hubspot: 'text-orange-400',
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-emerald-400 bg-emerald-400/10',
  running: 'text-blue-400 bg-blue-400/10',
  pending: 'text-gray-400 bg-gray-400/10',
  error: 'text-red-400 bg-red-400/10',
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completado',
  running: 'Ejecutando',
  pending: 'Pendiente',
  error: 'Error',
}

export function ClientsManager({ analyses, clientMap, clientResults, goalsMap }: ClientsManagerProps) {
  const [clients, setClients] = useState<Record<string, string | null>>(clientMap)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'dashboard' | 'manage'>('dashboard')

  const isClient = (analysisId: string) => analysisId in clients

  const handleAdd = async (analysisId: string, name?: string) => {
    setLoading(analysisId)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: analysisId, client_name: name || null }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Error ${res.status}`)
      }
      setClients((prev) => ({ ...prev, [analysisId]: name || null }))
      setEditingName(null)
    } finally {
      setLoading(null)
    }
  }

  const handleRemove = async (analysisId: string) => {
    setLoading(analysisId)
    try {
      const res = await fetch(`/api/clients/${analysisId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      setClients((prev) => {
        const next = { ...prev }
        delete next[analysisId]
        return next
      })
    } finally {
      setLoading(null)
    }
  }

  const clientAnalyses = analyses.filter((a) => isClient(a.id))
  const otherAnalyses = analyses.filter((a) => !isClient(a.id))

  const AnalysisRow = ({ analysis }: { analysis: AnalysisWithConnections }) => {
    const isTagged = isClient(analysis.id)
    const isLoadingThis = loading === analysis.id
    const isEditingThis = editingName === analysis.id
    const clientName = clients[analysis.id]

    return (
      <div className="flex items-center justify-between gap-4 bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {isTagged && (
            <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/analyses/${analysis.id}`}
                className="text-white font-medium text-sm hover:text-indigo-300 transition-colors truncate"
              >
                {clientName || analysis.name}
              </Link>
              {clientName && (
                <span className="text-gray-500 text-xs truncate hidden sm:inline">
                  ({analysis.name})
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[analysis.status]}`}>
                {STATUS_LABELS[analysis.status]}
              </span>
              <div className="flex items-center gap-1.5">
                {(analysis.analysis_connections || []).map((conn) => (
                  <span
                    key={conn.id}
                    className={`${PLATFORM_COLORS[conn.platform] || 'text-gray-400'}`}
                    title={conn.platform}
                  >
                    {PLATFORM_ICONS[conn.platform] || conn.platform}
                  </span>
                ))}
              </div>
              <span className="text-gray-600 text-xs">
                {new Date(analysis.date_range_start).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                {' — '}
                {new Date(analysis.date_range_end).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isTagged ? (
            <>
              {isEditingThis ? (
                <>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Nombre del cliente"
                    className="bg-[#0A0F1E] border border-indigo-500/30 rounded-md px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-500 w-40"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd(analysis.id, nameInput)
                      if (e.key === 'Escape') setEditingName(null)
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleAdd(analysis.id, nameInput)}
                    disabled={isLoadingThis}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setEditingName(null)}
                    className="text-xs text-gray-500 hover:text-white px-1 transition-colors"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setEditingName(analysis.id); setNameInput(clientName || '') }}
                    className="text-xs text-gray-400 hover:text-white border border-[#1F2937] hover:border-indigo-500/30 px-2 py-1 rounded-md transition-colors"
                  >
                    Renombrar
                  </button>
                  <button
                    onClick={() => handleRemove(analysis.id)}
                    disabled={isLoadingThis}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isLoadingThis ? '...' : 'Quitar'}
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {isEditingThis ? (
                <>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Nombre del cliente (opcional)"
                    className="bg-[#0A0F1E] border border-indigo-500/30 rounded-md px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-500 w-48"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd(analysis.id, nameInput)
                      if (e.key === 'Escape') setEditingName(null)
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleAdd(analysis.id, nameInput)}
                    disabled={isLoadingThis}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isLoadingThis ? '...' : 'Añadir'}
                  </button>
                  <button
                    onClick={() => setEditingName(null)}
                    className="text-xs text-gray-500 hover:text-white px-1 transition-colors"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setEditingName(analysis.id); setNameInput('') }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 px-3 py-1 rounded-md transition-colors"
                >
                  + Cliente
                </button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-[#0A0F1E] rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            activeView === 'dashboard'
              ? 'bg-[#111827] text-white shadow-sm border border-[#1F2937]'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveView('manage')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            activeView === 'manage'
              ? 'bg-[#111827] text-white shadow-sm border border-[#1F2937]'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Gestionar
        </button>
      </div>

      {/* Dashboard view */}
      {activeView === 'dashboard' && (
        <ClientsDashboard
          clientAnalyses={clientAnalyses}
          clientMap={clients}
          results={clientResults}
          goalsMap={goalsMap}
        />
      )}

      {/* Manage view */}
      {activeView === 'manage' && <div className="space-y-8">
      {/* Tagged clients */}
      {clientAnalyses.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-indigo-500" />
            <h2 className="text-lg font-bold text-white">Clientes activos</h2>
            <span className="text-gray-500 text-sm">({clientAnalyses.length})</span>
          </div>
          <div className="space-y-2">
            {clientAnalyses.map((analysis) => (
              <AnalysisRow key={analysis.id} analysis={analysis} />
            ))}
          </div>
        </section>
      )}

      {/* Other analyses */}
      {otherAnalyses.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-gray-600" />
            <h2 className="text-lg font-bold text-white">Otros análisis</h2>
            <span className="text-gray-500 text-sm">({otherAnalyses.length})</span>
          </div>
          <div className="space-y-2">
            {otherAnalyses.map((analysis) => (
              <AnalysisRow key={analysis.id} analysis={analysis} />
            ))}
          </div>
        </section>
      )}

      {analyses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-[#1F2937] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-white font-semibold mb-2">Sin análisis todavía</p>
          <p className="text-gray-400 text-sm mb-4">Crea un análisis primero para poder marcarlo como cliente.</p>
          <Link
            href="/analyses/new"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Crear análisis →
          </Link>
        </div>
      )}
      </div>}
    </div>
  )
}
