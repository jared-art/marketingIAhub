'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WizardData } from '@/types'
import { formatDate } from '@/lib/utils/formatters'
import { createClient } from '@/lib/supabase/client'

interface WizardStep3Props {
  data: WizardData
  onBack: () => void
}

const platformNames: Record<string, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  hubspot: 'HubSpot',
}

const platformIcons: Record<string, React.ReactNode> = {
  meta: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  google: (
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

export function WizardStep3({ data, onBack }: WizardStep3Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const connectedPlatforms = [
    data.step2.meta && { key: 'meta', accountName: data.step2.meta.accountName },
    data.step2.google && { key: 'google', accountName: data.step2.google.customerName },
    data.step2.hubspot && { key: 'hubspot', accountName: data.step2.hubspot.portalName },
  ].filter(Boolean) as { key: string; accountName: string }[]

  const handleLaunch = async () => {
    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Create analysis
      const { data: analysis, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          name: data.step1.name,
          description: data.step1.description || null,
          created_by: user.id,
          status: 'pending',
          date_range_start: data.step1.dateRangeStart,
          date_range_end: data.step1.dateRangeEnd,
        })
        .select()
        .single()

      if (analysisError) throw new Error(analysisError.message)

      // Create connections
      const connections = []
      if (data.step2.meta) {
        connections.push({
          analysis_id: analysis.id,
          platform: 'meta',
          credentials: {
            accessToken: data.step2.meta.accessToken,
          },
          selected_account_id: data.step2.meta.accountId,
          selected_account_name: data.step2.meta.accountName,
          status: 'connected',
        })
      }
      if (data.step2.google) {
        connections.push({
          analysis_id: analysis.id,
          platform: 'google_ads',
          credentials: {
            developerToken: data.step2.google.developerToken,
            clientId: data.step2.google.clientId,
            clientSecret: data.step2.google.clientSecret,
            refreshToken: data.step2.google.refreshToken,
            managerAccountId: data.step2.google.managerAccountId || '',
          },
          selected_account_id: data.step2.google.customerId,
          selected_account_name: data.step2.google.customerName,
          status: 'connected',
        })
      }
      if (data.step2.hubspot) {
        connections.push({
          analysis_id: analysis.id,
          platform: 'hubspot',
          credentials: {
            token: data.step2.hubspot.token,
          },
          selected_account_id: data.step2.hubspot.portalId,
          selected_account_name: data.step2.hubspot.portalName,
          status: 'connected',
        })
      }

      if (connections.length > 0) {
        const { error: connError } = await supabase
          .from('analysis_connections')
          .insert(connections)
        if (connError) throw new Error(connError.message)
      }

      router.push(`/analyses/${analysis.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el análisis')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Resumen del análisis</h2>
        <p className="text-gray-400 text-sm">
          Revisa la configuración antes de lanzar el análisis.
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-[#0A0F1E] border border-[#1F2937] rounded-xl p-5 space-y-4">
        {/* Analysis info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Análisis
            </span>
          </div>
          <h3 className="text-white font-semibold text-base">{data.step1.name}</h3>
          {data.step1.description && (
            <p className="text-gray-400 text-sm mt-1">{data.step1.description}</p>
          )}
        </div>

        <div className="border-t border-[#1F2937]" />

        {/* Date range */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Período de análisis
            </span>
          </div>
          <div className="flex items-center gap-2 text-white text-sm">
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(data.step1.dateRangeStart)} — {formatDate(data.step1.dateRangeEnd)}
          </div>
        </div>

        <div className="border-t border-[#1F2937]" />

        {/* Platforms */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Plataformas conectadas ({connectedPlatforms.length})
            </span>
          </div>
          <div className="space-y-2">
            {connectedPlatforms.map((p) => (
              <div key={p.key} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-[#111827] border border-[#1F2937] flex items-center justify-center flex-shrink-0">
                  {platformIcons[p.key]}
                </div>
                <div>
                  <span className="text-white text-sm font-medium">{platformNames[p.key]}</span>
                  <span className="text-gray-500 text-xs ml-2">{p.accountName}</span>
                </div>
                <div className="ml-auto">
                  <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                    Verificado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
        <h4 className="text-indigo-300 font-medium text-sm mb-2">¿Qué ocurre al lanzar?</h4>
        <ul className="space-y-1.5 text-xs text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">1.</span>
            Se guardan las conexiones de forma segura en la base de datos
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">2.</span>
            El sistema extrae datos de las plataformas conectadas
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">3.</span>
            Se calculan métricas y se generan insights con IA
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">4.</span>
            Se presenta un informe completo con recomendaciones accionables
          </li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex items-center gap-2 text-gray-400 hover:text-white border border-[#1F2937] hover:border-[#374151] disabled:opacity-50 font-medium px-6 py-3 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Anterior
        </button>
        <button
          onClick={handleLaunch}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-8 py-3 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/20"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creando análisis...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polygon points="5,3 19,12 5,21 5,3" />
              </svg>
              Lanzar Análisis
            </>
          )}
        </button>
      </div>
    </div>
  )
}
