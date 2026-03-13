'use client'

import { useState } from 'react'

const PLATFORM_LABELS: Record<string, string> = {
  meta: 'Meta Ads',
  google_ads: 'Google Ads',
  hubspot: 'HubSpot',
}

const PLATFORM_COLORS: Record<string, string> = {
  meta: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  google_ads: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  hubspot: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
}

const FIELD_LABELS: Record<string, Record<string, string>> = {
  meta: {
    accessToken: 'Access Token',
    accountId: 'Account ID',
    accountName: 'Cuenta',
  },
  google_ads: {
    accessToken: 'Access Token',
    developerToken: 'Developer Token',
    customerId: 'Customer ID',
    loginCustomerId: 'Login Customer ID',
    customerName: 'Cuenta',
  },
  hubspot: {
    token: 'Private App Token',
    portalId: 'Portal ID',
    portalName: 'Portal',
  },
}

const SENSITIVE_FIELDS = new Set(['accessToken', 'developerToken', 'token'])

function TokenField({ label, value, sensitive }: { label: string; value: string; sensitive: boolean }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!value) return null

  const display = sensitive && !revealed
    ? value.slice(0, 6) + '••••••••••••••••' + value.slice(-4)
    : value

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <div className="flex items-center gap-2 bg-[#0A0F1E] border border-[#1F2937] rounded-lg px-3 py-2">
        <code className="text-xs text-gray-300 flex-1 truncate font-mono">{display}</code>
        <div className="flex items-center gap-1 flex-shrink-0">
          {sensitive && (
            <button
              onClick={() => setRevealed(!revealed)}
              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
              title={revealed ? 'Ocultar' : 'Mostrar'}
            >
              {revealed ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
            title="Copiar"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="20,6 9,17 4,12" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

interface Connection {
  id: string
  platform: string
  credentials: Record<string, string>
  selected_account_id?: string
  selected_account_name?: string
  status: string
}

interface Analysis {
  id: string
  name: string
  date_range_start: string
  date_range_end: string
  created_at: string
  status: string
  analysis_connections: Connection[]
}

export function TokensClient({ analyses }: { analyses: Analysis[] }) {
  const analysesWithConnections = analyses.filter(
    (a) => a.analysis_connections && a.analysis_connections.length > 0
  )

  if (analysesWithConnections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-[#1F2937] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">Aún no hay credenciales guardadas.</p>
        <p className="text-gray-600 text-xs mt-1">Crea un análisis con plataformas conectadas para verlas aquí.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {analysesWithConnections.map((analysis) => (
        <div key={analysis.id} className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
          {/* Analysis header */}
          <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-sm">{analysis.name}</h3>
              <p className="text-gray-500 text-xs mt-0.5">
                {new Date(analysis.date_range_start).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' → '}
                {new Date(analysis.date_range_end).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' · '}
                Creado {new Date(analysis.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            <div className="flex gap-2">
              {analysis.analysis_connections.map((conn) => (
                <span
                  key={conn.id}
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PLATFORM_COLORS[conn.platform] || 'text-gray-400 bg-gray-400/10'}`}
                >
                  {PLATFORM_LABELS[conn.platform] || conn.platform}
                </span>
              ))}
            </div>
          </div>

          {/* Connections */}
          <div className="divide-y divide-[#1F2937]">
            {analysis.analysis_connections.map((conn) => {
              const fieldLabels = FIELD_LABELS[conn.platform] || {}
              const credentials = conn.credentials || {}

              return (
                <div key={conn.id} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PLATFORM_COLORS[conn.platform] || ''}`}>
                      {PLATFORM_LABELS[conn.platform] || conn.platform}
                    </span>
                    {conn.selected_account_name && (
                      <span className="text-xs text-gray-500">— {conn.selected_account_name}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(credentials).map(([key, value]) => {
                      if (!value || key === 'accountName' || key === 'customerName' || key === 'portalName') return null
                      return (
                        <TokenField
                          key={key}
                          label={fieldLabels[key] || key}
                          value={String(value)}
                          sensitive={SENSITIVE_FIELDS.has(key)}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
