'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Analysis, AnalysisConnection, AnalysisInsight } from '@/types'
import { formatDate, getStatusColor } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface AnalysisCardProps {
  analysis: Analysis
  connections: AnalysisConnection[]
  insights: AnalysisInsight[]
}

const platformIcons: Record<string, React.ReactNode> = {
  meta: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  google_ads: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  hubspot: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#FF7A59">
      <path d="M22.07 8.87c-.77-.77-1.8-1.2-2.87-1.2-.49 0-.97.09-1.42.27V5.4c0-.94-.38-1.84-1.05-2.5a3.54 3.54 0 0 0-2.5-1.05 3.54 3.54 0 0 0-2.5 1.05 3.54 3.54 0 0 0-1.05 2.5v2.54A3.47 3.47 0 0 0 9.07 8c-1.08 0-2.1.43-2.87 1.2A3.97 3.97 0 0 0 5 12.07c0 1.08.43 2.1 1.2 2.87l4.38 4.38a3.47 3.47 0 0 0 4.87 0l4.38-4.38c.77-.77 1.2-1.8 1.2-2.87a3.97 3.97 0 0 0-1.2-2.87v.8z"/>
    </svg>
  ),
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  running: 'Ejecutando',
  completed: 'Completado',
  error: 'Error',
}

export function AnalysisCard({ analysis, connections, insights }: AnalysisCardProps) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const connectedPlatforms = connections.filter((c) => c.status === 'connected')
  const criticalCount = insights.filter((i) => i.severity === 'critical').length
  const warningCount = insights.filter((i) => i.severity === 'warning').length

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(true)
    try {
      await fetch(`/api/analyses/${analysis.id}`, { method: 'DELETE' })
      router.refresh()
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div
      onClick={() => !confirmDelete && router.push(`/analyses/${analysis.id}`)}
      className={cn(
        'bg-[#111827] border rounded-xl p-5 transition-all duration-200 group',
        confirmDelete
          ? 'border-red-500/40 cursor-default'
          : 'border-[#1F2937] hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate group-hover:text-indigo-300 transition-colors">
            {analysis.name}
          </h3>
          {analysis.description && (
            <p className="text-gray-500 text-xs mt-0.5 truncate">{analysis.description}</p>
          )}
        </div>
        <span className={cn('ml-2 flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(analysis.status))}>
          {statusLabels[analysis.status] || analysis.status}
        </span>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {formatDate(analysis.date_range_start)} — {formatDate(analysis.date_range_end)}
      </div>

      {/* Platforms */}
      <div className="flex items-center gap-2 mb-4">
        {connectedPlatforms.length === 0 ? (
          <span className="text-xs text-gray-600">Sin plataformas conectadas</span>
        ) : (
          connectedPlatforms.map((conn) => (
            <div key={conn.id} className="flex items-center gap-1.5 bg-[#0A0F1E] rounded-md px-2 py-1 border border-[#1F2937]" title={conn.selected_account_name || conn.platform}>
              {platformIcons[conn.platform]}
              <span className="text-xs text-gray-400 capitalize max-w-[80px] truncate">
                {conn.selected_account_name || conn.platform}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Insights summary */}
      {analysis.status === 'completed' && insights.length > 0 && (
        <div className="border-t border-[#1F2937] pt-3 mt-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs text-gray-400">{criticalCount} crítico{criticalCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-xs text-gray-400">{warningCount} aviso{warningCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="ml-auto text-xs text-indigo-400 font-medium">
              {insights.length} insight{insights.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {analysis.status === 'pending' && (
        <div className="border-t border-[#1F2937] pt-3 mt-3">
          <span className="text-xs text-gray-500">Listo para ejecutar análisis</span>
        </div>
      )}

      {analysis.status === 'error' && (
        <div className="border-t border-red-500/20 pt-3 mt-3">
          <span className="text-xs text-red-400">Error al ejecutar el análisis</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-600">Creado {formatDate(analysis.created_at)}</span>
        {confirmDelete ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-red-400">¿Eliminar?</span>
            <button onClick={handleDelete} disabled={deleting} className="text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-md font-medium transition-colors">
              {deleting ? '...' : 'Sí'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }} className="text-xs text-gray-400 hover:text-white px-2 py-1 transition-colors">
              No
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all rounded"
            title="Eliminar análisis"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="3,6 5,6 21,6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
