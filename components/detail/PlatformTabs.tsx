'use client'

import { useState } from 'react'
import type { AnalysisConnection, AnalysisResult } from '@/types'
import { HubSpotFunnel } from './charts/HubSpotFunnel'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface PlatformTabsProps {
  connections: AnalysisConnection[]
  results: AnalysisResult[]
}

interface PlatformSummary {
  spend: number
  revenue: number
  roas: number
  impressions: number
  clicks: number
  conversions: number
  cpa: number
  ctr: number
  reach?: number
  frequency?: number
}

interface MetaCampaignRow {
  id: string; name: string; status: string; objective: string
  spend: number; impressions: number; clicks: number; reach: number
  frequency: number; conversions: number; revenue: number; ctr: number; cpa: number; roas: number
}

interface GoogleCampaignRow {
  id: string; name: string; status: string
  spend: number; impressions: number; clicks: number
  conversions: number; revenue: number; ctr: number; cpa: number; roas: number
}

interface KeywordInsights {
  avgQS: number | null; lowQSCount: number; midQSCount: number
  goodQSCount: number; totalKeywords: number
  keywords: { text: string; qs: number | null; impressions: number; clicks: number; spend: number }[]
}

interface HubSpotSummaryData {
  totalLeads: number; totalDeals: number; closedDeals: number
  totalRevenue: number; conversionRate: number; avgDealValue: number
  totalPipeline?: number
  attribution?: { source: string; label: string; count: number; revenue: number }[]
  leadAttribution?: { source: string; label: string; count: number; revenue: number }[]
}

interface HubSpotCampaign {
  id: string; name: string
}

// ── Helpers ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: 'good' | 'bad' | 'neutral' }) {
  return (
    <div className={cn(
      'bg-[#0A0F1E] border rounded-lg p-3',
      highlight === 'good' ? 'border-emerald-500/30' :
      highlight === 'bad' ? 'border-red-500/30' :
      'border-[#1F2937]'
    )}>
      <div className="text-gray-500 text-xs mb-1">{label}</div>
      <div className={cn('font-bold text-lg leading-tight',
        highlight === 'good' ? 'text-emerald-400' :
        highlight === 'bad' ? 'text-red-400' :
        'text-white'
      )}>{value}</div>
      {sub && <div className="text-gray-500 text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

function QSBadge({ qs }: { qs: number | null }) {
  if (qs === null) return <span className="text-gray-600 text-xs">—</span>
  const color = qs >= 7 ? 'text-emerald-400 bg-emerald-400/10' : qs >= 5 ? 'text-amber-400 bg-amber-400/10' : 'text-red-400 bg-red-400/10'
  return <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${color}`}>{qs}/10</span>
}

function ROASBadge({ roas }: { roas: number }) {
  if (roas === 0) return <span className="text-gray-500 text-xs">—</span>
  const color = roas >= 3 ? 'text-emerald-400' : roas >= 1.5 ? 'text-amber-400' : 'text-red-400'
  return <span className={`font-medium text-sm ${color}`}>{roas.toFixed(1)}x</span>
}

function Conclusion({ text }: { text: string }) {
  return (
    <div className="bg-[#0A0F1E] border border-indigo-500/20 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
        </svg>
        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">Conclusión</span>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
    </div>
  )
}

function NotConnected({ platform }: { platform: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-[#1F2937] flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <h3 className="text-white font-medium mb-1">Plataforma no conectada</h3>
      <p className="text-gray-500 text-sm max-w-xs">{platform} no fue incluida en este análisis.</p>
    </div>
  )
}

// ── Conclusion generators ────────────────────────────────────────────────

function generateMetaConclusion(s: PlatformSummary, campaigns: MetaCampaignRow[]): string {
  const parts: string[] = []
  if (s.roas >= 3) {
    parts.push(`Meta Ads muestra un rendimiento rentable con ROAS de ${s.roas.toFixed(1)}x sobre ${formatCurrency(s.spend)} invertidos.`)
  } else if (s.roas >= 1) {
    parts.push(`Meta Ads genera un ROAS de ${s.roas.toFixed(1)}x con ${formatCurrency(s.spend)} invertidos — rentable pero con margen de mejora significativo.`)
  } else if (s.spend > 0) {
    parts.push(`Meta Ads acumula ${formatCurrency(s.spend)} de inversión con un ROAS de ${s.roas.toFixed(1)}x, por debajo del umbral de rentabilidad.`)
  }
  if (s.conversions === 0 && s.spend > 0) {
    parts.push('No se registran conversiones — verificar la configuración del Pixel y los eventos de conversión en Events Manager.')
  } else if (s.conversions > 0) {
    parts.push(`Se han generado ${s.conversions.toFixed(0)} conversiones con CPA de ${formatCurrency(s.cpa)}.`)
  }
  if (s.frequency && s.frequency > 3.5) {
    parts.push(`La frecuencia alta (${s.frequency.toFixed(1)}x) indica saturación de audiencias — es urgente rotar creatividades.`)
  } else if (s.frequency && s.frequency > 2.5) {
    parts.push(`La frecuencia (${s.frequency.toFixed(1)}x) está en el límite recomendado — monitorear y preparar nuevas creatividades.`)
  }
  if (campaigns.length > 0) {
    const top = campaigns[0]
    const share = s.spend > 0 ? ((top.spend / s.spend) * 100).toFixed(0) : '0'
    parts.push(`La campaña principal "${top.name}" concentra el ${share}% del presupuesto con ROAS ${top.roas.toFixed(1)}x.`)
  }
  return parts.join(' ')
}

function generateGoogleConclusion(s: PlatformSummary, campaigns: GoogleCampaignRow[], kw?: KeywordInsights | null): string {
  const parts: string[] = []
  if (s.roas >= 4) {
    parts.push(`Google Ads presenta un rendimiento excelente con ROAS de ${s.roas.toFixed(1)}x — el canal más eficiente del período.`)
  } else if (s.roas >= 2) {
    parts.push(`Google Ads genera un ROAS de ${s.roas.toFixed(1)}x sobre ${formatCurrency(s.spend)} invertidos, mostrando rentabilidad positiva.`)
  } else if (s.spend > 0) {
    parts.push(`Google Ads muestra ${formatCurrency(s.spend)} de inversión con ROAS de ${s.roas.toFixed(1)}x, requiriendo optimización.`)
  }
  if (s.ctr < 3 && s.ctr > 0) {
    parts.push(`El CTR medio (${s.ctr.toFixed(2)}%) está por debajo del benchmark de Search (5-10%), indicando anuncios o keywords poco relevantes.`)
  } else if (s.ctr >= 5) {
    parts.push(`El CTR de ${s.ctr.toFixed(2)}% está dentro del benchmark de Search, indicando buena relevancia de anuncios.`)
  }
  if (kw && kw.avgQS !== null) {
    if (kw.avgQS >= 7) {
      parts.push(`El Quality Score medio (${kw.avgQS}/10) es bueno, lo que reduce el CPC frente a competidores.`)
    } else if (kw.avgQS < 5) {
      parts.push(`El Quality Score medio (${kw.avgQS}/10) es bajo — se está pagando un premium de CPC innecesario.`)
    }
  }
  if (campaigns.length > 0) {
    const top = campaigns[0]
    parts.push(`Campaña principal: "${top.name}" con ${formatCurrency(top.spend)} y ROAS ${top.roas.toFixed(1)}x.`)
  }
  return parts.join(' ')
}

function generateHubSpotConclusion(s: HubSpotSummaryData): string {
  const parts: string[] = []
  parts.push(`HubSpot registra ${s.totalLeads.toLocaleString('es-ES')} leads en el período con una tasa de conversión del ${s.conversionRate.toFixed(1)}%.`)
  if (s.closedDeals > 0) {
    parts.push(`Se han cerrado ${s.closedDeals} deals generando ${formatCurrency(s.totalRevenue)} de revenue con un ticket medio de ${formatCurrency(s.avgDealValue)}.`)
  }
  if (s.attribution && s.attribution.length > 0) {
    const top = s.attribution[0]
    parts.push(`La mayor fuente de revenue es "${top.label}" con ${top.count} deals cerrados (${formatCurrency(top.revenue)}).`)
  } else if (s.leadAttribution && s.leadAttribution.length > 0) {
    const top = s.leadAttribution[0]
    parts.push(`La principal fuente de leads es "${top.label}" (${top.count} leads, ${s.totalLeads > 0 ? ((top.count / s.totalLeads) * 100).toFixed(0) : 0}% del total).`)
  }
  if (s.conversionRate < 2) {
    parts.push('La tasa de conversión muy baja sugiere un problema de calidad de leads o de proceso de ventas.')
  } else if (s.conversionRate > 15) {
    parts.push('La alta tasa de conversión es una señal de calidad — escalar el volumen de leads multiplicará los resultados.')
  }
  return parts.join(' ')
}

function generateCombinedConclusion(
  meta: PlatformSummary | null,
  google: PlatformSummary | null,
  hubspot: HubSpotSummaryData | null
): string {
  const parts: string[] = []
  const totalSpend = (meta?.spend || 0) + (google?.spend || 0)
  const totalRevenue = (meta?.revenue || 0) + (google?.revenue || 0)

  if (totalSpend > 0) {
    const combinedROAS = totalRevenue > 0 ? totalRevenue / totalSpend : 0
    parts.push(`La inversión publicitaria total del período es ${formatCurrency(totalSpend)} generando ${formatCurrency(totalRevenue)} de revenue registrado en plataformas (ROAS combinado: ${combinedROAS.toFixed(1)}x).`)
  }

  if (meta && google) {
    if (google.roas > meta.roas * 1.2) {
      parts.push(`Google Ads es el canal más eficiente (ROAS ${google.roas.toFixed(1)}x vs Meta ${meta.roas.toFixed(1)}x) — se recomienda reasignar presupuesto hacia Search.`)
    } else if (meta.roas > google.roas * 1.2) {
      parts.push(`Meta Ads lidera en eficiencia (ROAS ${meta.roas.toFixed(1)}x vs Google ${google.roas.toFixed(1)}x) — incrementar presupuesto en Social tiene mayor ROI marginal.`)
    } else {
      parts.push(`Meta (ROAS ${meta.roas.toFixed(1)}x) y Google (ROAS ${google.roas.toFixed(1)}x) tienen rendimientos similares — mantener la distribución actual y optimizar creatividades y keywords.`)
    }
  }

  if (hubspot) {
    const cpl = totalSpend > 0 && hubspot.totalLeads > 0 ? totalSpend / hubspot.totalLeads : 0
    if (cpl > 0) {
      parts.push(`El CPL real combinado (inversión total / leads en HubSpot) es ${formatCurrency(cpl)} — este dato elimina la sobre-atribución de plataformas y es el KPI más fiable.`)
    }
    if (hubspot.totalRevenue > 0 && totalSpend > 0) {
      const realROAS = hubspot.totalRevenue / totalSpend
      parts.push(`El ROAS real basado en revenue de HubSpot es ${realROAS.toFixed(1)}x.`)
    }
  }

  return parts.join(' ')
}

// ── Campaign tables ──────────────────────────────────────────────────────

function CampaignTableMeta({ campaigns }: { campaigns: MetaCampaignRow[] }) {
  if (!campaigns.length) return null
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-400 mb-3">Desglose por campaña</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1F2937]">
              {['Campaña', 'Gasto', 'CTR', 'Conv.', 'CPA', 'ROAS', 'Frec.'].map((h) => (
                <th key={h} className="text-left py-2 px-2 text-gray-500 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-[#1F2937]/50 hover:bg-white/[0.02]">
                <td className="py-2.5 px-2">
                  <div className="text-gray-200 font-medium max-w-[180px] truncate" title={c.name}>{c.name}</div>
                  <div className="text-gray-600 text-xs mt-0.5">{formatCurrency(c.spend)} · {formatNumber(c.impressions)} impr.</div>
                </td>
                <td className="py-2.5 px-2">
                  <span className={cn('font-medium', c.ctr >= 2 ? 'text-emerald-400' : c.ctr >= 1 ? 'text-amber-400' : 'text-red-400')}>
                    {formatPercent(c.ctr)}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-gray-300">{c.conversions > 0 ? c.conversions.toFixed(0) : <span className="text-red-400">0</span>}</td>
                <td className="py-2.5 px-2 text-gray-400">{c.cpa > 0 ? formatCurrency(c.cpa) : '—'}</td>
                <td className="py-2.5 px-2"><ROASBadge roas={c.roas} /></td>
                <td className="py-2.5 px-2">
                  <span className={cn('font-medium', c.frequency > 4 ? 'text-red-400' : c.frequency > 2.5 ? 'text-amber-400' : 'text-gray-300')}>
                    {c.frequency > 0 ? c.frequency.toFixed(1) : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CampaignTableGoogle({ campaigns }: { campaigns: GoogleCampaignRow[] }) {
  if (!campaigns.length) return null
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-400 mb-3">Desglose por campaña</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1F2937]">
              {['Campaña', 'Gasto', 'CTR', 'Conv.', 'CPA', 'ROAS'].map((h) => (
                <th key={h} className="text-left py-2 px-2 text-gray-500 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-[#1F2937]/50 hover:bg-white/[0.02]">
                <td className="py-2.5 px-2">
                  <div className="text-gray-200 font-medium max-w-[200px] truncate" title={c.name}>{c.name}</div>
                  <div className="text-gray-600 text-xs mt-0.5">{formatCurrency(c.spend)} · {formatNumber(c.impressions)} impr.</div>
                </td>
                <td className="py-2.5 px-2">
                  <span className={cn('font-medium', c.ctr >= 5 ? 'text-emerald-400' : c.ctr >= 3 ? 'text-amber-400' : 'text-red-400')}>
                    {formatPercent(c.ctr)}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-gray-300">{c.conversions > 0 ? c.conversions.toFixed(0) : <span className="text-red-400">0</span>}</td>
                <td className="py-2.5 px-2 text-gray-400">{c.cpa > 0 ? formatCurrency(c.cpa) : '—'}</td>
                <td className="py-2.5 px-2"><ROASBadge roas={c.roas} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KeywordsSection({ kw }: { kw: KeywordInsights }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-400">Quality Score de keywords</h4>
        {kw.keywords.length > 0 && (
          <button onClick={() => setShow(!show)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            {show ? 'Ocultar' : `Ver ${kw.keywords.length} keywords`}
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatCard label="QS medio" value={kw.avgQS !== null ? `${kw.avgQS}/10` : '—'} highlight={kw.avgQS !== null ? (kw.avgQS >= 7 ? 'good' : kw.avgQS < 5 ? 'bad' : 'neutral') : 'neutral'} />
        <div className="bg-[#0A0F1E] border border-emerald-500/20 rounded-lg p-3 text-center">
          <div className="text-emerald-400 font-bold text-xl">{kw.goodQSCount}</div>
          <div className="text-gray-500 text-xs mt-0.5">QS ≥7</div>
        </div>
        <div className="bg-[#0A0F1E] border border-amber-500/20 rounded-lg p-3 text-center">
          <div className="text-amber-400 font-bold text-xl">{kw.midQSCount}</div>
          <div className="text-gray-500 text-xs mt-0.5">QS 5-6</div>
        </div>
        <div className="bg-[#0A0F1E] border border-red-500/20 rounded-lg p-3 text-center">
          <div className="text-red-400 font-bold text-xl">{kw.lowQSCount}</div>
          <div className="text-gray-500 text-xs mt-0.5">QS ≤4</div>
        </div>
      </div>
      {show && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1F2937]">
                {['Keyword', 'QS', 'Gasto', 'Impr.', 'Clics'].map((h) => (
                  <th key={h} className="text-left py-2 px-2 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kw.keywords.map((k, i) => (
                <tr key={i} className="border-b border-[#1F2937]/50">
                  <td className="py-2 px-2 text-gray-300 max-w-[200px] truncate">{k.text}</td>
                  <td className="py-2 px-2"><QSBadge qs={k.qs} /></td>
                  <td className="py-2 px-2 text-gray-400">{formatCurrency(k.spend)}</td>
                  <td className="py-2 px-2 text-gray-500">{formatNumber(k.impressions)}</td>
                  <td className="py-2 px-2 text-gray-500">{formatNumber(k.clicks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AttributionSection({ summary }: { summary: HubSpotSummaryData }) {
  const items = summary.attribution && summary.attribution.length > 0
    ? summary.attribution
    : summary.leadAttribution || []

  const isRevenue = !!(summary.attribution && summary.attribution.length > 0)
  if (!items.length) return null

  const total = items.reduce((s, i) => s + (isRevenue ? i.revenue : i.count), 0)

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-400 mb-3">
        Atribución por fuente — {isRevenue ? 'revenue cerrado' : 'leads generados'}
      </h4>
      <div className="space-y-2">
        {items.slice(0, 8).map((item) => {
          const value = isRevenue ? item.revenue : item.count
          const pct = total > 0 ? (value / total) * 100 : 0
          return (
            <div key={item.source} className="flex items-center gap-3">
              <div className="text-gray-400 text-xs w-32 flex-shrink-0 truncate">{item.label}</div>
              <div className="flex-1 h-1.5 bg-[#0A0F1E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-gray-300 text-xs w-24 text-right flex-shrink-0">
                {isRevenue ? formatCurrency(item.revenue) : `${item.count} leads`}
                <span className="text-gray-600 ml-1">({pct.toFixed(0)}%)</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Combined tab ─────────────────────────────────────────────────────────

function CombinedTab({
  meta, google, hubspot
}: {
  meta: PlatformSummary | null
  google: PlatformSummary | null
  hubspot: HubSpotSummaryData | null
}) {
  const totalSpend = (meta?.spend || 0) + (google?.spend || 0)
  const totalRevenue = (meta?.revenue || 0) + (google?.revenue || 0)
  const combinedROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const cpl = totalSpend > 0 && (hubspot?.totalLeads || 0) > 0
    ? totalSpend / hubspot!.totalLeads : 0

  const conclusion = generateCombinedConclusion(meta, google, hubspot)

  return (
    <div className="space-y-6">
      {/* Combined KPIs */}
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-3">Métricas combinadas</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Inversión total" value={formatCurrency(totalSpend)} />
          <StatCard label="Revenue registrado" value={formatCurrency(totalRevenue)} />
          <StatCard
            label="ROAS combinado"
            value={`${combinedROAS.toFixed(1)}x`}
            highlight={combinedROAS >= 3 ? 'good' : combinedROAS >= 1.5 ? 'neutral' : 'bad'}
          />
          {hubspot && (
            <StatCard label="Leads en HubSpot" value={formatNumber(hubspot.totalLeads)} />
          )}
          {cpl > 0 && (
            <StatCard label="CPL real combinado" value={formatCurrency(cpl)} sub="Inversión / leads reales" />
          )}
          {hubspot && hubspot.totalRevenue > 0 && totalSpend > 0 && (
            <StatCard
              label="ROAS real (HubSpot)"
              value={`${(hubspot.totalRevenue / totalSpend).toFixed(1)}x`}
              sub="Revenue cerrado / inversión"
              highlight={(hubspot.totalRevenue / totalSpend) >= 3 ? 'good' : 'neutral'}
            />
          )}
        </div>
      </div>

      {/* Channel comparison */}
      {meta && google && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">Comparativa de canales</h4>
          <div className="space-y-3">
            {[
              { label: 'Inversión', metaVal: formatCurrency(meta.spend), googleVal: formatCurrency(google.spend), metaNum: meta.spend, googleNum: google.spend },
              { label: 'Revenue', metaVal: formatCurrency(meta.revenue), googleVal: formatCurrency(google.revenue), metaNum: meta.revenue, googleNum: google.revenue },
              { label: 'ROAS', metaVal: `${meta.roas.toFixed(1)}x`, googleVal: `${google.roas.toFixed(1)}x`, metaNum: meta.roas, googleNum: google.roas },
              { label: 'CPA', metaVal: meta.cpa > 0 ? formatCurrency(meta.cpa) : '—', googleVal: google.cpa > 0 ? formatCurrency(google.cpa) : '—', metaNum: meta.cpa, googleNum: google.cpa },
              { label: 'CTR', metaVal: formatPercent(meta.ctr), googleVal: formatPercent(google.ctr), metaNum: meta.ctr, googleNum: google.ctr },
            ].map((row) => (
              <div key={row.label} className="grid grid-cols-3 gap-2 items-center text-sm">
                <div className="text-gray-500 text-xs">{row.label}</div>
                <div className="bg-[#0A0F1E] border border-[#1F2937] rounded-lg px-3 py-2 text-center">
                  <div className="text-xs text-blue-400 font-medium mb-0.5">Meta</div>
                  <div className="text-white font-bold text-sm">{row.metaVal}</div>
                </div>
                <div className="bg-[#0A0F1E] border border-[#1F2937] rounded-lg px-3 py-2 text-center">
                  <div className="text-xs text-indigo-400 font-medium mb-0.5">Google</div>
                  <div className="text-white font-bold text-sm">{row.googleVal}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HubSpot attribution in combined view */}
      {hubspot && (summary => summary && <AttributionSection summary={summary} />)(hubspot)}

      {/* Combined conclusion */}
      {conclusion && <Conclusion text={conclusion} />}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────

export function PlatformTabs({ connections, results }: PlatformTabsProps) {
  const [activeTab, setActiveTab] = useState('meta')

  const isConnected = (platform: string) =>
    connections.some((c) => c.platform === platform && c.status === 'connected')

  const getResult = (platform: string) => results.find((r) => r.platform === platform)

  const metaResult = getResult('meta')
  const googleResult = getResult('google_ads')
  const hubspotResult = getResult('hubspot')

  const metaSummary = (metaResult?.raw_data as { summary?: PlatformSummary })?.summary ?? null
  const metaCampaigns = ((metaResult?.raw_data as { campaigns?: MetaCampaignRow[] })?.campaigns) ?? []

  const googleSummary = (googleResult?.raw_data as { summary?: PlatformSummary })?.summary ?? null
  const googleCampaigns = ((googleResult?.raw_data as { campaigns?: GoogleCampaignRow[] })?.campaigns) ?? []
  const googleKeywords = (googleResult?.raw_data as { keywords?: KeywordInsights })?.keywords ?? null

  const hubspotSummary = (hubspotResult?.raw_data as { summary?: HubSpotSummaryData })?.summary ?? null
  const hubspotCampaigns = ((hubspotResult?.raw_data as { campaigns?: HubSpotCampaign[] })?.campaigns) ?? []

  const hasCombined = (isConnected('meta') || isConnected('google_ads')) &&
    !!(metaSummary || googleSummary)

  const tabs = [
    { id: 'meta', label: 'Meta Ads' },
    { id: 'google', label: 'Google Ads' },
    { id: 'hubspot', label: 'HubSpot' },
    ...(hasCombined ? [{ id: 'combined', label: 'Resumen combinado' }] : []),
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-[#0A0F1E] rounded-lg p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-[#111827] text-white shadow-sm border border-[#1F2937]'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6">

        {/* META */}
        {activeTab === 'meta' && (
          <>
            {!isConnected('meta') ? <NotConnected platform="Meta Ads" /> :
             !metaSummary ? <div className="text-center py-8 text-gray-500 text-sm">Ejecuta el análisis para ver datos de Meta.</div> : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Inversión" value={formatCurrency(metaSummary.spend)} />
                  <StatCard label="Revenue" value={formatCurrency(metaSummary.revenue)} />
                  <StatCard label="ROAS" value={`${metaSummary.roas.toFixed(1)}x`} highlight={metaSummary.roas >= 3 ? 'good' : metaSummary.roas >= 1.5 ? 'neutral' : 'bad'} />
                  <StatCard label="CPA" value={metaSummary.cpa > 0 ? formatCurrency(metaSummary.cpa) : '—'} />
                  <StatCard label="Impresiones" value={formatNumber(metaSummary.impressions)} />
                  <StatCard label="Clics" value={formatNumber(metaSummary.clicks)} />
                  <StatCard label="CTR" value={formatPercent(metaSummary.ctr)} highlight={metaSummary.ctr >= 2 ? 'good' : metaSummary.ctr >= 1 ? 'neutral' : 'bad'} />
                  <StatCard label="Conversiones" value={formatNumber(metaSummary.conversions)} highlight={metaSummary.conversions > 0 ? 'neutral' : metaSummary.spend > 300 ? 'bad' : 'neutral'} />
                  {metaSummary.reach !== undefined && (
                    <StatCard label="Alcance" value={formatNumber(metaSummary.reach)} sub={metaSummary.frequency ? `Frecuencia: ${metaSummary.frequency.toFixed(1)}x` : undefined} highlight={metaSummary.frequency && metaSummary.frequency > 3.5 ? 'bad' : 'neutral'} />
                  )}
                </div>
                <CampaignTableMeta campaigns={metaCampaigns} />
                <Conclusion text={generateMetaConclusion(metaSummary, metaCampaigns)} />
              </div>
            )}
          </>
        )}

        {/* GOOGLE */}
        {activeTab === 'google' && (
          <>
            {!isConnected('google_ads') ? <NotConnected platform="Google Ads" /> :
             !googleSummary ? <div className="text-center py-8 text-gray-500 text-sm">Ejecuta el análisis para ver datos de Google.</div> : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Inversión" value={formatCurrency(googleSummary.spend)} />
                  <StatCard label="Revenue" value={formatCurrency(googleSummary.revenue)} />
                  <StatCard label="ROAS" value={`${googleSummary.roas.toFixed(1)}x`} highlight={googleSummary.roas >= 4 ? 'good' : googleSummary.roas >= 2 ? 'neutral' : 'bad'} />
                  <StatCard label="CPA" value={googleSummary.cpa > 0 ? formatCurrency(googleSummary.cpa) : '—'} />
                  <StatCard label="Impresiones" value={formatNumber(googleSummary.impressions)} />
                  <StatCard label="Clics" value={formatNumber(googleSummary.clicks)} />
                  <StatCard label="CTR" value={formatPercent(googleSummary.ctr)} highlight={googleSummary.ctr >= 5 ? 'good' : googleSummary.ctr >= 3 ? 'neutral' : 'bad'} />
                  <StatCard label="Conversiones" value={formatNumber(googleSummary.conversions)} highlight={googleSummary.conversions > 0 ? 'neutral' : googleSummary.spend > 500 ? 'bad' : 'neutral'} />
                  {googleKeywords?.avgQS !== null && googleKeywords?.avgQS !== undefined && (
                    <StatCard label="Quality Score" value={`${googleKeywords.avgQS}/10`} sub={`${googleKeywords.totalKeywords} keywords`} highlight={googleKeywords.avgQS >= 7 ? 'good' : googleKeywords.avgQS < 5 ? 'bad' : 'neutral'} />
                  )}
                </div>
                {googleKeywords && googleKeywords.totalKeywords > 0 && <KeywordsSection kw={googleKeywords} />}
                <CampaignTableGoogle campaigns={googleCampaigns} />
                <Conclusion text={generateGoogleConclusion(googleSummary, googleCampaigns, googleKeywords)} />
              </div>
            )}
          </>
        )}

        {/* HUBSPOT */}
        {activeTab === 'hubspot' && (
          <>
            {!isConnected('hubspot') ? <NotConnected platform="HubSpot" /> :
             !hubspotSummary ? <div className="text-center py-8 text-gray-500 text-sm">Ejecuta el análisis para ver datos de HubSpot.</div> : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCard label="Total leads" value={formatNumber(hubspotSummary.totalLeads)} />
                  <StatCard label="Total deals" value={formatNumber(hubspotSummary.totalDeals)} />
                  <StatCard label="Deals ganados" value={formatNumber(hubspotSummary.closedDeals)} />
                  <StatCard label="Revenue cerrado" value={formatCurrency(hubspotSummary.totalRevenue)} highlight={hubspotSummary.totalRevenue > 0 ? 'good' : 'neutral'} />
                  <StatCard label="Tasa conversión" value={formatPercent(hubspotSummary.conversionRate)} highlight={hubspotSummary.conversionRate >= 5 ? 'good' : hubspotSummary.conversionRate < 2 ? 'bad' : 'neutral'} />
                  <StatCard label="Ticket medio" value={formatCurrency(hubspotSummary.avgDealValue)} />
                </div>
                <AttributionSection summary={hubspotSummary} />
                {hubspotCampaigns.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Campañas de marketing vinculadas</h4>
                    <div className="space-y-1">
                      {hubspotCampaigns.slice(0, 10).map((c) => (
                        <div key={c.id} className="text-xs text-gray-400 bg-[#0A0F1E] border border-[#1F2937] rounded px-3 py-2">{c.name}</div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Embudo de conversión</h4>
                  <HubSpotFunnel summary={hubspotSummary} />
                </div>
                <Conclusion text={generateHubSpotConclusion(hubspotSummary)} />
              </div>
            )}
          </>
        )}

        {/* COMBINED */}
        {activeTab === 'combined' && (
          <CombinedTab
            meta={metaSummary}
            google={googleSummary}
            hubspot={hubspotSummary}
          />
        )}
      </div>
    </div>
  )
}
