'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RunAnalysisButtonProps {
  analysisId: string
  label?: string
}

export function RunAnalysisButton({ analysisId, label = 'Ejecutar Análisis' }: RunAnalysisButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleRun = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/analyses/${analysisId}/run`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al ejecutar el análisis')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleRun}
        disabled={loading}
        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-8 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 text-base"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Ejecutando...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polygon points="5,3 19,12 5,21 5,3" />
            </svg>
            {label}
          </>
        )}
      </button>
      {error && (
        <p className="text-red-400 text-sm max-w-md text-center">{error}</p>
      )}
    </div>
  )
}
