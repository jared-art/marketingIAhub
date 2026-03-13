'use client'

import type { WizardStep2PlatformData } from '@/types'
import { PlatformConnector } from './PlatformConnector'

interface WizardStep2Props {
  data: WizardStep2PlatformData
  onChange: (data: WizardStep2PlatformData) => void
  onNext: () => void
  onBack: () => void
}

export function WizardStep2({ data, onChange, onNext, onBack }: WizardStep2Props) {
  const hasAtLeastOnePlatform = data.meta || data.google || data.hubspot

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Conecta tus plataformas</h2>
        <p className="text-gray-400 text-sm">
          Conecta al menos una plataforma publicitaria. Cuantas más conectes, más completo será el análisis.
        </p>
      </div>

      {/* Platform connectors */}
      <div className="space-y-3">
        <PlatformConnector
          platform="meta"
          isConnected={!!data.meta}
          connectedData={data.meta as Record<string, string> | undefined}
          onVerified={(credentials) => {
            onChange({
              ...data,
              meta: {
                accessToken: credentials.accessToken,
                accountId: credentials.accountId,
                accountName: credentials.accountName,
              },
            })
          }}
        />

        <PlatformConnector
          platform="google_ads"
          isConnected={!!data.google}
          connectedData={data.google as Record<string, string> | undefined}
          onVerified={(credentials) => {
            onChange({
              ...data,
              google: {
                developerToken: credentials.developerToken,
                clientId: credentials.clientId,
                clientSecret: credentials.clientSecret,
                refreshToken: credentials.refreshToken,
                managerAccountId: credentials.managerAccountId,
                customerId: credentials.customerId,
                customerName: credentials.customerName,
              },
            })
          }}
        />

        <PlatformConnector
          platform="hubspot"
          isConnected={!!data.hubspot}
          connectedData={data.hubspot as Record<string, string> | undefined}
          onVerified={(credentials) => {
            onChange({
              ...data,
              hubspot: {
                token: credentials.token,
                portalId: credentials.portalId,
                portalName: credentials.portalName,
              },
            })
          }}
        />
      </div>

      {/* Status message */}
      {!hasAtLeastOnePlatform && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 flex items-start gap-2">
          <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-amber-400 text-sm">
            Conecta al menos una plataforma para continuar
          </p>
        </div>
      )}

      {hasAtLeastOnePlatform && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 flex items-start gap-2">
          <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="20,6 9,17 4,12" />
          </svg>
          <p className="text-emerald-400 text-sm">
            {[data.meta && 'Meta Ads', data.google && 'Google Ads', data.hubspot && 'HubSpot']
              .filter(Boolean)
              .join(', ')}{' '}
            {Object.values(data).filter(Boolean).length === 1 ? 'conectado' : 'conectados'}.
            {!data.meta || !data.google || !data.hubspot
              ? ' Puedes añadir más plataformas para un análisis más completo.'
              : ' ¡Análisis completo con las 3 plataformas!'}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white border border-[#1F2937] hover:border-[#374151] font-medium px-6 py-3 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Anterior
        </button>
        <button
          onClick={onNext}
          disabled={!hasAtLeastOnePlatform}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-all duration-200"
        >
          Siguiente
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
