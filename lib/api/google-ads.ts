export interface GoogleCreds {
  accessToken?: string
  refreshToken?: string
  developerToken: string
  customerId: string
  loginCustomerId?: string
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET no están configurados en el servidor')
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Error al renovar el token de Google')
  }
  return data.access_token as string
}

export interface GoogleCampaignRow {
  id: string
  name: string
  status: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  cpa: number
  roas: number
}

export interface KeywordQS {
  text: string
  qs: number | null
  impressions: number
  clicks: number
  spend: number
}

export interface KeywordInsights {
  keywords: KeywordQS[]
  avgQS: number | null
  lowQSCount: number   // QS < 5
  midQSCount: number   // QS 5-6
  goodQSCount: number  // QS >= 7
  totalKeywords: number
}

export async function runGAQLQuery(creds: GoogleCreds, query: string) {
  const cleanId = creds.customerId.replace(/-/g, '')
  const cleanLoginId = (creds.loginCustomerId || creds.customerId).replace(/-/g, '')
  const url = `https://googleads.googleapis.com/v17/customers/${cleanId}/googleAds:search`

  // Prefer refreshToken (long-lived) over accessToken (1h expiry)
  let accessToken = creds.accessToken
  if (creds.refreshToken) {
    accessToken = await refreshGoogleAccessToken(creds.refreshToken)
  }
  if (!accessToken) throw new Error('Se requiere accessToken o refreshToken para Google Ads')

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': creds.developerToken,
    'login-customer-id': cleanLoginId,
    'Content-Type': 'application/json',
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'GAQL query failed')
  }
  return res.json()
}

export function normalizeGoogleCampaigns(campaigns: unknown[]): GoogleCampaignRow[] {
  return campaigns
    .map((c: unknown) => {
      const row = c as { campaign?: Record<string, string>; metrics?: Record<string, string> }
      const metrics = row.metrics || {}
      const spend = parseInt(metrics.costMicros || '0') / 1_000_000
      const impressions = parseInt(metrics.impressions || '0')
      const clicks = parseInt(metrics.clicks || '0')
      const conversions = parseFloat(metrics.conversions || '0')
      const revenue = parseFloat(metrics.conversionsValue || '0')

      return {
        id: row.campaign?.id || '',
        name: row.campaign?.name || '',
        status: row.campaign?.status || '',
        spend,
        impressions,
        clicks,
        conversions,
        revenue,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
        roas: spend > 0 ? revenue / spend : 0,
      }
    })
    .filter((c) => c.spend > 0)
    .sort((a, b) => b.spend - a.spend)
}

export async function getGoogleKeywords(creds: GoogleCreds, dateStart: string, dateEnd: string) {
  const query = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.quality_info.quality_score,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros
    FROM keyword_view
    WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
    AND ad_group_criterion.status = 'ENABLED'
    AND campaign.status = 'ENABLED'
    AND metrics.impressions > 0
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `
  try {
    return await runGAQLQuery(creds, query)
  } catch {
    return { results: [] }
  }
}

export function computeKeywordInsights(results: unknown[]): KeywordInsights {
  let totalQS = 0, qsCount = 0, lowQS = 0, midQS = 0, goodQS = 0

  const keywords: KeywordQS[] = results.map((k: unknown) => {
    const row = k as {
      adGroupCriterion?: {
        keyword?: { text?: string }
        qualityInfo?: { qualityScore?: number }
      }
      metrics?: Record<string, string>
    }
    const text = row.adGroupCriterion?.keyword?.text || ''
    const qs = row.adGroupCriterion?.qualityInfo?.qualityScore ?? null
    const impressions = parseInt(row.metrics?.impressions || '0')
    const clicks = parseInt(row.metrics?.clicks || '0')
    const spend = parseInt(row.metrics?.costMicros || '0') / 1_000_000

    if (qs !== null) {
      totalQS += qs
      qsCount++
      if (qs <= 4) lowQS++
      else if (qs <= 6) midQS++
      else goodQS++
    }

    return { text, qs, impressions, clicks, spend }
  })

  return {
    keywords: keywords.slice(0, 30),
    avgQS: qsCount > 0 ? Math.round((totalQS / qsCount) * 10) / 10 : null,
    lowQSCount: lowQS,
    midQSCount: midQS,
    goodQSCount: goodQS,
    totalKeywords: qsCount,
  }
}

export function computeGoogleSummary(campaigns: unknown[]) {
  let totalSpend = 0,
    totalImpressions = 0,
    totalClicks = 0,
    totalConversions = 0,
    totalConvValue = 0

  campaigns.forEach((c: unknown) => {
    const campaign = c as { metrics?: Record<string, string> }
    const metrics = campaign.metrics || {}
    totalSpend += parseInt(metrics.costMicros || '0') / 1_000_000
    totalImpressions += parseInt(metrics.impressions || '0')
    totalClicks += parseInt(metrics.clicks || '0')
    totalConversions += parseFloat(metrics.conversions || '0')
    totalConvValue += parseFloat(metrics.conversionsValue || '0')
  })

  return {
    spend: totalSpend,
    impressions: totalImpressions,
    clicks: totalClicks,
    conversions: totalConversions,
    revenue: totalConvValue,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    cpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
    roas: totalSpend > 0 ? totalConvValue / totalSpend : 0,
  }
}
