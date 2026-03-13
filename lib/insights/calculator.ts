import type { AnalysisInsight } from '@/types'
import type { MetaCampaignRow, GoogleCampaignRow, KeywordInsights } from '@/lib/api/google-ads'

interface PlatformData {
  meta?: {
    spend: number
    impressions: number
    clicks: number
    conversions: number
    revenue: number
    ctr: number
    cpa: number
    roas: number
    reach: number
    frequency: number
    campaigns: MetaCampaignRow[]
  }
  google?: {
    spend: number
    impressions: number
    clicks: number
    conversions: number
    revenue: number
    ctr: number
    cpa: number
    roas: number
    campaigns: GoogleCampaignRow[]
    keywords?: KeywordInsights
  }
  hubspot?: {
    totalLeads: number
    totalDeals: number
    closedDeals: number
    totalRevenue: number
    conversionRate: number
    avgDealValue: number
    contacts: unknown[]
    deals: unknown[]
  }
}

type InsightEntry = Omit<AnalysisInsight, 'id' | 'created_at'>

export function calculateInsights(data: PlatformData, analysisId: string): InsightEntry[] {
  const insights: InsightEntry[] = []
  const { meta, google, hubspot } = data

  function push(insight: Omit<InsightEntry, 'analysis_id'>) {
    insights.push({ ...insight, analysis_id: analysisId })
  }

  // ── META: Account-level ────────────────────────────────────────────────

  if (meta) {
    // No conversions with significant spend
    if (meta.conversions === 0 && meta.spend > 300) {
      push({
        type: 'problem',
        severity: 'critical',
        platform: 'meta',
        title: 'Meta Ads: 0 conversiones registradas con gasto significativo',
        description: `Se han invertido €${meta.spend.toFixed(0)} sin registrar ninguna conversión. El píxel puede estar mal configurado o las campañas optimizan para un evento que no se dispara.`,
        metric_value: `€${meta.spend.toFixed(0)} gasto — 0 conversiones`,
        metric_benchmark: 'CVR esperado: >1%',
        action_recommended:
          'Verificar el Pixel en Events Manager. Comprobar que el evento de conversión de campaña coincide con el evento del píxel (ej: Lead vs Purchase).',
      })
    }

    // CTR below benchmark
    if (meta.ctr > 0 && meta.ctr < 1) {
      push({
        type: 'problem',
        severity: meta.ctr < 0.5 ? 'critical' : 'warning',
        platform: 'meta',
        title: `CTR de Meta por debajo del benchmark: ${meta.ctr.toFixed(2)}%`,
        description: `El CTR medio es ${meta.ctr.toFixed(2)}%, por debajo del benchmark (1-3%). Las creatividades no están resonando con la audiencia objetivo o hay fatiga publicitaria.`,
        metric_value: `CTR: ${meta.ctr.toFixed(2)}%`,
        metric_benchmark: 'Benchmark sector: 1-3%',
        action_recommended:
          'Renovar creatividades con vídeo corto (Reels). Testar UGC. Revisar segmentación de audiencias y ampliar si es muy estrecha.',
      })
    }

    // Good ROAS — scale up
    if (meta.roas >= 3 && meta.spend > 0) {
      push({
        type: 'opportunity',
        severity: 'info',
        platform: 'meta',
        title: `Meta Ads rentable — ROAS ${meta.roas.toFixed(1)}x`,
        description: `Las campañas de Meta generan ${meta.roas.toFixed(1)}x de retorno. Existe oportunidad de escalar incrementando el presupuesto un 15-20% semanal sin perder eficiencia.`,
        metric_value: `ROAS: ${meta.roas.toFixed(1)}x | Gasto: €${meta.spend.toFixed(0)}`,
        metric_benchmark: 'ROAS mínimo rentable: 2-3x',
        action_recommended:
          'Aumentar presupuesto de las campañas top un 15% esta semana. Expandir audiencias lookalike del 1% al 3%.',
      })
    }

    // Real frequency — creative fatigue
    if (meta.frequency > 3) {
      push({
        type: 'problem',
        severity: meta.frequency > 5 ? 'critical' : 'warning',
        platform: 'meta',
        title: `Fatiga creativa: frecuencia media ${meta.frequency.toFixed(1)}x`,
        description: `La frecuencia media es ${meta.frequency.toFixed(1)}x — cada usuario ve los anuncios más de ${Math.floor(meta.frequency)} veces en el período. Esto eleva el CPM y reduce la tasa de respuesta.`,
        metric_value: `Frecuencia: ${meta.frequency.toFixed(1)}x | Alcance: ${meta.reach.toLocaleString('es-ES')} personas`,
        metric_benchmark: 'Frecuencia recomendada: <3x por período',
        action_recommended:
          'Rotar creatividades nuevas. Ampliar audiencia. Configurar frequency caps en el nivel de ad set (máx. 2-3 por semana).',
      })
    }
  }

  // ── META: Campaign-level ───────────────────────────────────────────────

  if (meta && meta.campaigns.length > 0) {
    const totalMetaSpend = meta.spend

    // Top spender underperforming
    const topCampaign = meta.campaigns[0]
    const topShare = totalMetaSpend > 0 ? topCampaign.spend / totalMetaSpend : 0
    if (topShare > 0.5 && topCampaign.roas < 1 && topCampaign.spend > 300) {
      push({
        type: 'problem',
        severity: 'critical',
        platform: 'meta',
        title: `"${topCampaign.name}" consume ${(topShare * 100).toFixed(0)}% del presupuesto con ROAS negativo`,
        description: `Esta campaña acumula el ${(topShare * 100).toFixed(0)}% del gasto total (€${topCampaign.spend.toFixed(0)}) pero tiene un ROAS de ${topCampaign.roas.toFixed(1)}x — por debajo del umbral de rentabilidad. Está arrastrando los resultados globales.`,
        metric_value: `Gasto: €${topCampaign.spend.toFixed(0)} | ROAS: ${topCampaign.roas.toFixed(1)}x`,
        metric_benchmark: 'ROAS mínimo rentable: 2x',
        action_recommended:
          'Pausar o reducir el presupuesto de esta campaña un 50%. Revisar el targeting, las creatividades y la página de destino.',
      })
    }

    // Campaign concentration risk
    if (topShare > 0.7 && meta.campaigns.length > 2) {
      push({
        type: 'problem',
        severity: 'warning',
        platform: 'meta',
        title: 'Concentración de presupuesto excesiva en una sola campaña',
        description: `El ${(topShare * 100).toFixed(0)}% del presupuesto está concentrado en "${topCampaign.name}". Si esta campaña falla (fatiga, cambio de audiencia), impacta toda la cuenta.`,
        metric_value: `${(topShare * 100).toFixed(0)}% en una campaña`,
        metric_benchmark: 'Máximo recomendado: 50% en una campaña',
        action_recommended:
          'Diversificar el presupuesto entre al menos 3 campañas con objetivos y audiencias distintas.',
      })
    }

    // Campaigns with high frequency
    const highFreqCampaigns = meta.campaigns.filter((c) => c.frequency > 4 && c.spend > 100)
    if (highFreqCampaigns.length > 0) {
      const names = highFreqCampaigns.slice(0, 2).map((c) => `"${c.name}"`).join(', ')
      push({
        type: 'problem',
        severity: 'warning',
        platform: 'meta',
        title: `${highFreqCampaigns.length} campaña${highFreqCampaigns.length > 1 ? 's' : ''} con frecuencia crítica`,
        description: `${names} ${highFreqCampaigns.length > 1 ? 'tienen' : 'tiene'} frecuencia superior a 4x. La audiencia objetivo está saturada — los CPM aumentarán y el CTR caerá si no se actúa.`,
        metric_value: highFreqCampaigns.map((c) => `${c.name}: ${c.frequency.toFixed(1)}x`).join(' | '),
        metric_benchmark: 'Frecuencia máxima recomendada: 3x',
        action_recommended:
          'Renovar creatividades inmediatamente en estas campañas. Ampliar o cambiar las audiencias. Considerar Advantage+ Audience.',
      })
    }

    // Best performing campaign — scale signal
    const bestCampaign = meta.campaigns.find((c) => c.roas > 5 && c.spend > 200)
    if (bestCampaign) {
      push({
        type: 'opportunity',
        severity: 'info',
        platform: 'meta',
        title: `Campaña estrella: "${bestCampaign.name}" con ROAS ${bestCampaign.roas.toFixed(1)}x`,
        description: `Esta campaña tiene un rendimiento excepcional. Incrementar su presupuesto gradualmente tiene el mayor potencial de ROI incremental en Meta.`,
        metric_value: `ROAS: ${bestCampaign.roas.toFixed(1)}x | CPA: €${bestCampaign.cpa.toFixed(0)} | Gasto: €${bestCampaign.spend.toFixed(0)}`,
        metric_benchmark: 'ROAS excelente: >5x',
        action_recommended:
          'Aumentar el presupuesto un 20% esta semana. Duplicar la audiencia lookalike. Mantener las creatividades actuales sin tocarlas.',
      })
    }

    // Campaigns with 0 conversions + spend
    const zeroCampaigns = meta.campaigns.filter((c) => c.conversions === 0 && c.spend > 150)
    if (zeroCampaigns.length > 0 && meta.conversions > 0) {
      const names = zeroCampaigns.slice(0, 2).map((c) => `"${c.name}"`).join(', ')
      push({
        type: 'problem',
        severity: 'warning',
        platform: 'meta',
        title: `${zeroCampaigns.length} campaña${zeroCampaigns.length > 1 ? 's' : ''} sin conversiones`,
        description: `${names} llevan gastados €${zeroCampaigns.reduce((s, c) => s + c.spend, 0).toFixed(0)} sin generar ninguna conversión. Son candidatas a pausar o reestructurar.`,
        metric_value: zeroCampaigns.map((c) => `${c.name}: €${c.spend.toFixed(0)}`).join(' | '),
        metric_benchmark: 'Umbral: 0 conversiones con >€150 gasto',
        action_recommended:
          'Pausar estas campañas. Revisar el objetivo de campaña, el evento de conversión y el landing page.',
      })
    }
  }

  // ── GOOGLE: Account-level ──────────────────────────────────────────────

  if (google) {
    // Low CTR
    if (google.ctr > 0 && google.ctr < 3) {
      push({
        type: 'problem',
        severity: google.ctr < 1.5 ? 'critical' : 'warning',
        platform: 'google_ads',
        title: `CTR de Google Search bajo: ${google.ctr.toFixed(2)}%`,
        description: `CTR medio de ${google.ctr.toFixed(2)}%, por debajo del benchmark (5-10% en Search). Indica anuncios poco relevantes para las búsquedas o Quality Score bajo.`,
        metric_value: `CTR: ${google.ctr.toFixed(2)}%`,
        metric_benchmark: 'Benchmark Search: 5-10%',
        action_recommended:
          'Mejorar titulares de RSA incluyendo palabras clave exactas. Añadir extensiones de anuncio (sitelinks, callouts). Revisar relevancia keyword ↔ anuncio ↔ landing page.',
      })
    }

    // High spend, low conversions
    if (google.spend > 500 && google.conversions < 5) {
      push({
        type: 'problem',
        severity: 'critical',
        platform: 'google_ads',
        title: 'Alto gasto en Google Ads con conversiones mínimas',
        description: `€${google.spend.toFixed(0)} invertidos generando solo ${google.conversions.toFixed(0)} conversiones (CPA: €${google.cpa.toFixed(0)}). El tracking de conversiones puede estar roto o las keywords son irrelevantes.`,
        metric_value: `€${google.spend.toFixed(0)} gasto | ${google.conversions.toFixed(0)} conversiones | CPA €${google.cpa.toFixed(0)}`,
        metric_benchmark: 'CPA objetivo: según sector',
        action_recommended:
          'Verificar el tracking de conversiones con Google Tag Assistant. Revisar los search terms report y añadir negativas. Pausar campañas con CPA >3x objetivo.',
      })
    }

    // Good ROAS
    if (google.roas >= 4) {
      push({
        type: 'opportunity',
        severity: 'info',
        platform: 'google_ads',
        title: `Google Ads con ROAS excelente: ${google.roas.toFixed(1)}x`,
        description: `Las campañas de Google generan ${google.roas.toFixed(1)}x de retorno — el canal más eficiente. Incrementar presupuesto aquí tiene el mayor potencial de ROI.`,
        metric_value: `ROAS: ${google.roas.toFixed(1)}x | Revenue: €${google.revenue.toFixed(0)}`,
        metric_benchmark: 'ROAS excelente: >4x',
        action_recommended:
          'Aumentar presupuesto un 25%. Activar Target ROAS si aún no está activo. Expandir keywords relacionadas con las de mayor rendimiento.',
      })
    }
  }

  // ── GOOGLE: Quality Score ──────────────────────────────────────────────

  if (google?.keywords && google.keywords.totalKeywords > 0) {
    const kw = google.keywords

    // Low average QS
    if (kw.avgQS !== null && kw.avgQS < 5) {
      push({
        type: 'problem',
        severity: kw.avgQS < 4 ? 'critical' : 'warning',
        platform: 'google_ads',
        title: `Quality Score medio bajo: ${kw.avgQS}/10`,
        description: `El QS medio de las palabras clave es ${kw.avgQS}/10. Un QS bajo eleva el CPC y reduce la posición de los anuncios, aumentando el coste por conversión. Afecta a ${kw.totalKeywords} keywords activas.`,
        metric_value: `QS medio: ${kw.avgQS} | QS < 5: ${kw.lowQSCount} keywords | QS ≥ 7: ${kw.goodQSCount} keywords`,
        metric_benchmark: 'QS objetivo: ≥7 (ideal ≥8)',
        action_recommended:
          'Mejorar la relevancia keyword → anuncio → landing page. Agrupar keywords en ad groups más específicos. Reescribir anuncios para incluir las palabras clave exactas.',
      })
    } else if (kw.avgQS !== null && kw.avgQS >= 7) {
      push({
        type: 'opportunity',
        severity: 'info',
        platform: 'google_ads',
        title: `Quality Score alto: ${kw.avgQS}/10 — ventaja competitiva`,
        description: `QS medio de ${kw.avgQS}/10. Un QS alto significa CPCs más bajos y mejor posicionamiento que la competencia con el mismo presupuesto.`,
        metric_value: `QS medio: ${kw.avgQS} | ${kw.goodQSCount} de ${kw.totalKeywords} keywords con QS ≥7`,
        metric_benchmark: 'QS objetivo: ≥7',
        action_recommended:
          'Mantener la estructura de campañas actual. Identificar las keywords con QS ≥9 y expandir con variantes similares.',
      })
    }

    // Many low QS keywords
    const lowQSPct = kw.totalKeywords > 0 ? (kw.lowQSCount / kw.totalKeywords) * 100 : 0
    if (lowQSPct > 30 && kw.lowQSCount >= 5) {
      push({
        type: 'problem',
        severity: 'warning',
        platform: 'google_ads',
        title: `${kw.lowQSCount} palabras clave con QS ≤4 (${lowQSPct.toFixed(0)}% del total)`,
        description: `Un ${lowQSPct.toFixed(0)}% de las keywords activas tienen QS ≤4, lo que significa que estás pagando hasta 3x más de CPC que competidores con mejor QS en las mismas palabras.`,
        metric_value: `${kw.lowQSCount} keywords con QS ≤4 de ${kw.totalKeywords} activas`,
        metric_benchmark: 'Máximo recomendado con QS <5: <10%',
        action_recommended:
          'Pausar keywords con QS ≤3 y gasto sin conversiones. Para las de QS 4, crear ad groups específicos con anuncios más relevantes.',
      })
    }
  }

  // ── GOOGLE: Campaign-level ─────────────────────────────────────────────

  if (google && google.campaigns.length > 0) {
    // Best campaign
    const bestGoogle = google.campaigns.find((c) => c.roas > 5 && c.spend > 200)
    if (bestGoogle) {
      push({
        type: 'opportunity',
        severity: 'info',
        platform: 'google_ads',
        title: `Campaña Google estrella: "${bestGoogle.name}"`,
        description: `ROAS de ${bestGoogle.roas.toFixed(1)}x con €${bestGoogle.spend.toFixed(0)} invertidos. Es la campaña más eficiente — escalar el presupuesto generará ROI incremental inmediato.`,
        metric_value: `ROAS: ${bestGoogle.roas.toFixed(1)}x | CPA: €${bestGoogle.cpa.toFixed(0)}`,
        metric_benchmark: 'ROAS excelente: >5x',
        action_recommended:
          'Aumentar el presupuesto un 20-30%. Activar Target ROAS con el valor actual como objetivo. Expandir keywords similares.',
      })
    }

    // Campaign with high CTR but 0 conversions (tracking issue signal)
    const trackingIssue = google.campaigns.find(
      (c) => c.ctr > 5 && c.conversions === 0 && c.spend > 200
    )
    if (trackingIssue) {
      push({
        type: 'problem',
        severity: 'critical',
        platform: 'google_ads',
        title: `Posible error de tracking en "${trackingIssue.name}"`,
        description: `CTR de ${trackingIssue.ctr.toFixed(1)}% (buen interés) pero 0 conversiones con €${trackingIssue.spend.toFixed(0)} invertidos. Es muy probable que el tracking de conversiones esté roto en esta campaña.`,
        metric_value: `CTR: ${trackingIssue.ctr.toFixed(1)}% | Conversiones: 0 | Gasto: €${trackingIssue.spend.toFixed(0)}`,
        metric_benchmark: 'CVR esperado con CTR >5%: >2%',
        action_recommended:
          'Auditar el tag de conversión con Google Tag Assistant. Verificar que la URL de destino tiene el tag correcto. Comprobar que la acción de conversión no está en pausa.',
      })
    }
  }

  // ── CROSS-PLATFORM ─────────────────────────────────────────────────────

  // CPA comparison Meta vs Google
  if (meta && google && meta.cpa > 0 && google.cpa > 0) {
    const ratio = meta.cpa / google.cpa
    if (ratio > 1.5) {
      push({
        type: 'problem',
        severity: ratio > 2.5 ? 'critical' : 'warning',
        platform: 'cross_platform',
        title: `CPA de Meta ${ratio.toFixed(1)}x mayor que Google`,
        description: `Meta CPA: €${meta.cpa.toFixed(0)} vs Google CPA: €${google.cpa.toFixed(0)}. Google es significativamente más eficiente para captar conversiones en este período.`,
        metric_value: `Meta CPA: €${meta.cpa.toFixed(0)} | Google CPA: €${google.cpa.toFixed(0)}`,
        metric_benchmark: 'Diferencia máxima recomendada: 1.5x',
        action_recommended:
          'Reasignar 20% del presupuesto de Meta hacia Google. Optimizar el funnel de Meta (audiencias, creatividades) hasta equiparar CPA.',
      })
    }
  }

  // Budget allocation: high Meta spend vs better Google ROAS
  if (meta && google) {
    const totalSpend = meta.spend + google.spend
    const metaShare = totalSpend > 0 ? (meta.spend / totalSpend) * 100 : 0
    if (metaShare > 60 && google.roas > meta.roas * 1.3) {
      push({
        type: 'opportunity',
        severity: 'warning',
        platform: 'cross_platform',
        title: `Redistribución recomendada: Google tiene ROAS ${((google.roas / meta.roas - 1) * 100).toFixed(0)}% mayor`,
        description: `El ${metaShare.toFixed(0)}% del presupuesto va a Meta (ROAS ${meta.roas.toFixed(1)}x), pero Google tiene ROAS ${google.roas.toFixed(1)}x. Redirigir presupuesto a Google aumentaría el ROAS combinado.`,
        metric_value: `Meta: ${metaShare.toFixed(0)}% presupuesto, ROAS ${meta.roas.toFixed(1)}x | Google: ${(100 - metaShare).toFixed(0)}%, ROAS ${google.roas.toFixed(1)}x`,
        metric_benchmark: 'Asignación ideal: basada en ROAS marginal por canal',
        action_recommended:
          'Mover 20% del presupuesto de Meta a Google. Monitorear 2 semanas y ajustar según resultados.',
      })
    }
  }

  // Combined ROAS below target
  if (meta || google) {
    const totalSpend = (meta?.spend || 0) + (google?.spend || 0)
    const totalRevenue = (meta?.revenue || 0) + (google?.revenue || 0)
    const combinedROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
    if (combinedROAS > 0 && combinedROAS < 2) {
      push({
        type: 'problem',
        severity: combinedROAS < 1 ? 'critical' : 'warning',
        platform: 'cross_platform',
        title: `ROAS combinado bajo: ${combinedROAS.toFixed(1)}x`,
        description: `ROAS combinado de todas las plataformas: ${combinedROAS.toFixed(1)}x. Para un margen >40%, el ROAS mínimo rentable es 2.5x. Las campañas actuales pueden estar generando pérdidas.`,
        metric_value: `ROAS: ${combinedROAS.toFixed(1)}x (€${totalRevenue.toFixed(0)} revenue / €${totalSpend.toFixed(0)} gasto)`,
        metric_benchmark: 'ROAS mínimo rentable (margen 40%): 2.5x',
        action_recommended:
          'Pausar campañas con ROAS <1.5x. Incrementar presupuesto en las de ROAS >3x. Revisar la configuración de valores de conversión.',
      })
    }
  }

  // Attribution discrepancy (ads reported ROAS vs real HubSpot)
  if (hubspot && (meta || google)) {
    const adsSpend = (meta?.spend || 0) + (google?.spend || 0)
    const adsRevenue = (meta?.revenue || 0) + (google?.revenue || 0)
    const realRevenue = hubspot.totalRevenue
    const reportedROAS = adsSpend > 0 ? adsRevenue / adsSpend : 0
    const realROAS = adsSpend > 0 ? realRevenue / adsSpend : 0
    if (reportedROAS > 0 && realROAS > 0) {
      const discrepancy = (reportedROAS - realROAS) / reportedROAS
      if (discrepancy > 0.3) {
        push({
          type: 'problem',
          severity: discrepancy > 0.5 ? 'critical' : 'warning',
          platform: 'cross_platform',
          title: `Discrepancia de atribución: ${(discrepancy * 100).toFixed(0)}% entre ads y HubSpot`,
          description: `Las plataformas reportan ROAS ${reportedROAS.toFixed(1)}x, pero el ROAS real calculado con ingresos de HubSpot es ${realROAS.toFixed(1)}x. Diferencia del ${(discrepancy * 100).toFixed(0)}% — sobre-atribución en plataformas.`,
          metric_value: `ROAS plataformas: ${reportedROAS.toFixed(1)}x | ROAS real HubSpot: ${realROAS.toFixed(1)}x`,
          metric_benchmark: 'Discrepancia aceptable: <20%',
          action_recommended:
            'Implementar UTM parameters en todos los anuncios. Revisar modelo de atribución. Configurar Conversions API (Meta CAPI / Enhanced Conversions Google).',
        })
      }
    }
  }

  // ── HUBSPOT ────────────────────────────────────────────────────────────

  if (hubspot) {
    // Low lead-to-client conversion
    if (hubspot.totalLeads > 10 && hubspot.conversionRate < 5) {
      push({
        type: 'problem',
        severity: hubspot.conversionRate < 2 ? 'critical' : 'warning',
        platform: 'hubspot',
        title: `Tasa de conversión lead→cliente baja: ${hubspot.conversionRate.toFixed(1)}%`,
        description: `Solo el ${hubspot.conversionRate.toFixed(1)}% de los leads se convierten en clientes (${hubspot.closedDeals} de ${hubspot.totalLeads}). Puede indicar leads de baja calidad o un proceso de ventas con fricciones.`,
        metric_value: `${hubspot.conversionRate.toFixed(1)}% (${hubspot.closedDeals} cerrados de ${hubspot.totalLeads} leads)`,
        metric_benchmark: 'Benchmark: 5-15% según sector',
        action_recommended:
          'Implementar lead scoring en HubSpot. Revisar workflows de nurturing. Mejorar la cualificación de leads en las campañas (audiencias más específicas).',
      })
    }

    // High conversion — scale signal
    if (hubspot.totalLeads > 10 && hubspot.conversionRate > 15) {
      push({
        type: 'opportunity',
        severity: 'info',
        platform: 'hubspot',
        title: `Alta tasa de conversión: ${hubspot.conversionRate.toFixed(1)}% — oportunidad de escalar`,
        description: `La tasa de conversión del ${hubspot.conversionRate.toFixed(1)}% está por encima del benchmark. Incrementar el volumen de leads multiplicaría los ingresos sin cambiar el proceso de ventas.`,
        metric_value: `${hubspot.conversionRate.toFixed(1)}% | ${hubspot.closedDeals} clientes de ${hubspot.totalLeads} leads`,
        metric_benchmark: 'Benchmark: 5-15% según sector',
        action_recommended:
          'Aumentar el presupuesto en campañas de captación de leads. Escalar los formatos que generan leads de mayor calidad (lead forms, landing pages con alta CVR).',
      })
    }

    // Real cost per lead (cross-platform)
    if (hubspot.totalLeads > 0 && (meta || google)) {
      const totalAdsSpend = (meta?.spend || 0) + (google?.spend || 0)
      const costPerLead = totalAdsSpend / hubspot.totalLeads
      push({
        type: 'recommendation',
        severity: costPerLead > 150 ? 'warning' : 'info',
        platform: 'cross_platform',
        title: `CPL real combinado: €${costPerLead.toFixed(0)} por lead`,
        description: `Combinando toda la inversión publicitaria (€${totalAdsSpend.toFixed(0)}) con los leads en HubSpot (${hubspot.totalLeads}), el CPL real es €${costPerLead.toFixed(0)}. Este dato es más fiable que los CPAs reportados en plataformas.`,
        metric_value: `CPL real: €${costPerLead.toFixed(0)} | ${hubspot.totalLeads} leads totales`,
        metric_benchmark: 'CPL objetivo: depende del ticket medio y margen',
        action_recommended:
          'Usar este CPL como KPI principal de campaña. Si el ticket medio supera 10x el CPL, la inversión es rentable. Optimizar campañas hacia este coste real.',
      })
    }
  }

  // Deduplicate by title to avoid near-duplicate insights
  const seen = new Set<string>()
  return insights.filter((i) => {
    if (seen.has(i.title)) return false
    seen.add(i.title)
    return true
  })
}
