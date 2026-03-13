'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface PlatformConnectorProps {
  platform: 'meta' | 'google_ads' | 'hubspot'
  onVerified: (data: Record<string, string>) => void
  isConnected: boolean
  connectedData?: Record<string, string>
}

const platformInfo = {
  meta: {
    name: 'Meta Ads',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: '#1877F2',
    description: 'Conecta tu cuenta de Meta Business Manager para analizar tus campañas de Facebook e Instagram.',
  },
  google_ads: {
    name: 'Google Ads',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
    color: '#4285F4',
    description: 'Conecta Google Ads con tus credenciales OAuth para analizar campañas de búsqueda y display.',
  },
  hubspot: {
    name: 'HubSpot',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#FF7A59">
        <path d="M22.07 8.87c-.77-.77-1.8-1.2-2.87-1.2-.49 0-.97.09-1.42.27V5.4c0-.94-.38-1.84-1.05-2.5a3.54 3.54 0 0 0-2.5-1.05 3.54 3.54 0 0 0-2.5 1.05 3.54 3.54 0 0 0-1.05 2.5v2.54A3.47 3.47 0 0 0 9.07 8c-1.08 0-2.1.43-2.87 1.2A3.97 3.97 0 0 0 5 12.07c0 1.08.43 2.1 1.2 2.87l4.38 4.38a3.47 3.47 0 0 0 4.87 0l4.38-4.38c.77-.77 1.2-1.8 1.2-2.87a3.97 3.97 0 0 0-1.2-2.87v.8z"/>
      </svg>
    ),
    color: '#FF7A59',
    description: 'Conecta HubSpot con un token de Private App para analizar leads, deals y conversiones.',
  },
}

export function PlatformConnector({ platform, onVerified, isConnected, connectedData }: PlatformConnectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Meta fields
  const [metaToken, setMetaToken] = useState('')
  const [metaAccounts, setMetaAccounts] = useState<{ id: string; name: string; account_id: string }[]>([])
  const [metaSelectedAccount, setMetaSelectedAccount] = useState('')

  // Google fields
  const [googleToken, setGoogleToken] = useState('')
  const [googleCustomerId, setGoogleCustomerId] = useState('')

  // HubSpot fields
  const [hubspotToken, setHubspotToken] = useState('')

  const info = platformInfo[platform]

  const handleVerifyMeta = async () => {
    if (!metaToken) { setError('Ingresa el token de acceso'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/platforms/meta/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: metaToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al verificar')
      setMetaAccounts(data.accounts || [])
      if ((data.accounts || []).length === 1) {
        const acc = data.accounts[0]
        setMetaSelectedAccount(acc.account_id)
        onVerified({
          accessToken: metaToken,
          accountId: acc.account_id,
          accountName: acc.name,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar Meta')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMetaAccount = (accountId: string) => {
    const acc = metaAccounts.find((a) => a.account_id === accountId)
    if (acc) {
      setMetaSelectedAccount(accountId)
      onVerified({
        accessToken: metaToken,
        accountId: acc.account_id,
        accountName: acc.name,
      })
    }
  }

  const handleVerifyGoogle = async () => {
    if (!googleToken || !googleCustomerId) {
      setError('Token y Customer ID son obligatorios')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/platforms/google/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken, customerId: googleCustomerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al verificar')
      onVerified({
        token: googleToken,
        customerId: googleCustomerId,
        customerName: data.customerName || googleCustomerId,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar Google Ads')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyHubSpot = async () => {
    if (!hubspotToken) { setError('Ingresa el token de acceso'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/platforms/hubspot/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: hubspotToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al verificar')
      onVerified({
        token: hubspotToken,
        portalId: String(data.portalId),
        portalName: data.companyName || `Portal ${data.portalId}`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar HubSpot')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden transition-all duration-200',
        isConnected
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-[#1F2937] bg-[#111827]'
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0A0F1E] border border-[#1F2937] flex items-center justify-center">
            {info.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium text-sm">{info.name}</span>
              {isConnected && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  Conectado
                </span>
              )}
            </div>
            {isConnected && connectedData && (
              <p className="text-xs text-gray-500 mt-0.5">
                {connectedData.accountName || connectedData.portalName || connectedData.customerName || 'Cuenta verificada'}
              </p>
            )}
            {!isConnected && (
              <p className="text-xs text-gray-500 mt-0.5">{info.description.substring(0, 60)}...</p>
            )}
          </div>
        </div>
        <svg
          className={cn('w-4 h-4 text-gray-400 transition-transform', isExpanded ? 'rotate-180' : '')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded form */}
      {isExpanded && (
        <div className="px-4 pb-5 pt-1 border-t border-[#1F2937]">
          <p className="text-gray-400 text-xs mb-4">{info.description}</p>

          {platform === 'meta' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Token de acceso de Meta Business <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={metaToken}
                  onChange={(e) => setMetaToken(e.target.value)}
                  placeholder="EAABsbCS..."
                  className="w-full bg-[#0A0F1E] border border-[#1F2937] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                />
                <p className="text-gray-600 text-xs mt-1">
                  Genera un System User Token desde Meta Business Manager con permisos de ads_read
                </p>
              </div>

              {metaAccounts.length > 1 && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Selecciona la cuenta publicitaria
                  </label>
                  <select
                    value={metaSelectedAccount}
                    onChange={(e) => handleSelectMetaAccount(e.target.value)}
                    className="w-full bg-[#0A0F1E] border border-[#1F2937] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {metaAccounts.map((acc) => (
                      <option key={acc.account_id} value={acc.account_id}>
                        {acc.name} ({acc.account_id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
              )}

              {!isConnected && (
                <button
                  onClick={handleVerifyMeta}
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verificando...
                    </>
                  ) : 'Verificar conexión'}
                </button>
              )}
            </div>
          )}

          {platform === 'google_ads' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Token de gaql.app <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={googleToken}
                  onChange={(e) => setGoogleToken(e.target.value)}
                  placeholder="Pega aquí tu token de gaql.app"
                  className="w-full bg-[#0A0F1E] border border-[#1F2937] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                />
                <p className="text-gray-600 text-xs mt-1">
                  Ve a{' '}
                  <a href="https://gaql.app" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                    gaql.app
                  </a>
                  , inicia sesión con tu cuenta de Google y copia el token
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Customer ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={googleCustomerId}
                  onChange={(e) => setGoogleCustomerId(e.target.value)}
                  placeholder="1234567890"
                  className="w-full bg-[#0A0F1E] border border-[#1F2937] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                />
                <p className="text-gray-600 text-xs mt-1">
                  Número de cuenta de Google Ads sin guiones
                </p>
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
              )}

              {!isConnected && (
                <button
                  onClick={handleVerifyGoogle}
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verificando...
                    </>
                  ) : 'Verificar conexión'}
                </button>
              )}
            </div>
          )}

          {platform === 'hubspot' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Private App Token <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={hubspotToken}
                  onChange={(e) => setHubspotToken(e.target.value)}
                  placeholder="pat-na1-..."
                  className="w-full bg-[#0A0F1E] border border-[#1F2937] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                />
                <p className="text-gray-600 text-xs mt-1">
                  Crea una Private App en HubSpot con permisos de contacts, deals y account-info
                </p>
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
              )}

              {!isConnected && (
                <button
                  onClick={handleVerifyHubSpot}
                  disabled={loading}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verificando...
                    </>
                  ) : 'Verificar conexión'}
                </button>
              )}
            </div>
          )}

          {isConnected && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2.5 mt-2">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="20,6 9,17 4,12" />
              </svg>
              <span className="text-emerald-400 text-sm font-medium">Plataforma verificada y lista para el análisis</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
