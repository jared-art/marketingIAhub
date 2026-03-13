'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteAnalysisButton({ analysisId }: { analysisId: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analyses/${analysisId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      router.push('/dashboard')
      router.refresh()
    } catch {
      setLoading(false)
      setConfirm(false)
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">¿Eliminar análisis?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Eliminando...' : 'Sí, eliminar'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-white px-2 py-1.5 transition-colors"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/10"
      title="Eliminar análisis"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polyline points="3,6 5,6 21,6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
      </svg>
      Eliminar
    </button>
  )
}
