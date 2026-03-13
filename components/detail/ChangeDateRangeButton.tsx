'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ChangeDateRangeButtonProps {
  analysisId: string
  currentStart: string
  currentEnd: string
}

export function ChangeDateRangeButton({
  analysisId,
  currentStart,
  currentEnd,
}: ChangeDateRangeButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [start, setStart] = useState(currentStart.slice(0, 10))
  const [end, setEnd] = useState(currentEnd.slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleApply = async () => {
    if (!start || !end) return
    if (start > end) { setError('La fecha de inicio debe ser anterior a la de fin'); return }

    setLoading(true)
    setError('')

    try {
      // 1. Update dates + clear results
      const patchRes = await fetch(`/api/analyses/${analysisId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date_range_start: start, date_range_end: end }),
      })
      if (!patchRes.ok) throw new Error('Error al actualizar el período')

      // 2. Immediately trigger re-run
      const runRes = await fetch(`/api/analyses/${analysisId}/run`, { method: 'POST' })
      if (!runRes.ok) throw new Error('Error al ejecutar el análisis')

      setOpen(false)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-[#1F2937] hover:border-indigo-500/50 bg-[#111827] hover:bg-indigo-600/10 px-3 py-1.5 rounded-lg transition-all duration-200"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Cambiar período
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-[#111827] border border-indigo-500/30 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          disabled={loading}
          className="bg-[#0A0F1E] border border-[#1F2937] rounded-md px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50 [color-scheme:dark]"
        />
        <span className="text-gray-600 text-xs">→</span>
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          disabled={loading}
          className="bg-[#0A0F1E] border border-[#1F2937] rounded-md px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50 [color-scheme:dark]"
        />
      </div>

      {error && <span className="text-red-400 text-xs">{error}</span>}

      <button
        onClick={handleApply}
        disabled={loading}
        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Ejecutando...
          </>
        ) : 'Aplicar y re-ejecutar'}
      </button>

      <button
        onClick={() => { setOpen(false); setError('') }}
        disabled={loading}
        className="text-gray-500 hover:text-white text-xs px-1 transition-colors disabled:opacity-50"
      >
        ✕
      </button>
    </div>
  )
}
