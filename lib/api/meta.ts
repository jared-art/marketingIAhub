// Conversion action types that count as meaningful conversions in Meta
// Top-level types only (no offsite_conversion.* subtypes to avoid double-counting)
const CONVERSION_TYPES = new Set([
  'purchase',
  'lead',
  'complete_registration',
  'contact',
  'subscribe',
  'initiated_checkout',
])

export interface MetaCampaignRow {
  id: string
  name: string
  status: string
  objective: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  frequency: number
  conversions: number
  revenue: number
  ctr: number
  cpa: number
  roas: number
}

export async function getMetaAdAccounts(accessToken: string) {
  const url = `https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id,currency,timezone_name,account_status&access_token=${accessToken}&limit=100`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Error fetching Meta accounts')
  }
  const data = await res.json()
  return data.data || []
}

export async function getMetaCampaigns(
  accessToken: string,
  accountId: string,
  since: string,
  until: string
) {
  // Ensure YYYY-MM-DD format (strip time component if present)
  const sinceDate = since.slice(0, 10)
  const untilDate = until.slice(0, 10)

  const insightFields =
    'spend,impressions,clicks,ctr,reach,frequency,actions,action_values,purchase_roas'
  const fields = `id,name,status,objective,insights.time_range({"since":"${sinceDate}","until":"${untilDate}"}){${insightFields}}`

  const params = new URLSearchParams({
    fields,
    access_token: accessToken,
    limit: '50',
  })

  const url = `https://graph.facebook.com/v19.0/act_${accountId}/campaigns?${params}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Error fetching Meta campaigns')
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'Meta API error')
  return data.data || []
}

function parseCampaignInsights(campaign: Record<string, unknown>) {
  const insights = campaign.insights as { data?: Record<string, unknown>[] } | undefined
  const ins = insights?.data?.[0]
  if (!ins) return null

  const spend = parseFloat((ins.spend as string) || '0')
  const impressions = parseInt((ins.impressions as string) || '0')
  const clicks = parseInt((ins.clicks as string) || '0')
  const reach = parseInt((ins.reach as string) || '0')
  const frequency = parseFloat((ins.frequency as string) || '0')

  // Count all conversion types (avoids the "only purchase" bug)
  const actions = ins.actions as { action_type: string; value: string }[] | undefined
  let conversions = 0
  actions?.forEach((a) => {
    if (CONVERSION_TYPES.has(a.action_type)) {
      conversions += parseFloat(a.value || '0')
    }
  })

  // Revenue from purchase action values
  const actionValues = ins.action_values as { action_type: string; value: string }[] | undefined
  const purchaseValue = actionValues?.find((a) => a.action_type === 'purchase')
  const revenue = purchaseValue ? parseFloat(purchaseValue.value || '0') : 0

  return {
    spend,
    impressions,
    clicks,
    reach,
    frequency,
    conversions,
    revenue,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpa: conversions > 0 ? spend / conversions : 0,
    roas: spend > 0 ? revenue / spend : 0,
  }
}

export function normalizeCampaigns(campaigns: unknown[]): MetaCampaignRow[] {
  return campaigns
    .map((c) => {
      const campaign = c as Record<string, unknown>
      const ins = parseCampaignInsights(campaign)
      return {
        id: (campaign.id as string) || '',
        name: (campaign.name as string) || '',
        status: (campaign.status as string) || '',
        objective: (campaign.objective as string) || '',
        spend: ins?.spend ?? 0,
        impressions: ins?.impressions ?? 0,
        clicks: ins?.clicks ?? 0,
        reach: ins?.reach ?? 0,
        frequency: ins?.frequency ?? 0,
        conversions: ins?.conversions ?? 0,
        revenue: ins?.revenue ?? 0,
        ctr: ins?.ctr ?? 0,
        cpa: ins?.cpa ?? 0,
        roas: ins?.roas ?? 0,
      }
    })
    .filter((c) => c.spend > 0)
    .sort((a, b) => b.spend - a.spend)
}

export function computeMetaSummary(campaigns: unknown[]) {
  let totalSpend = 0,
    totalImpressions = 0,
    totalClicks = 0,
    totalConversions = 0,
    totalRevenue = 0,
    totalReach = 0

  campaigns.forEach((c: unknown) => {
    const campaign = c as Record<string, unknown>
    const ins = parseCampaignInsights(campaign)
    if (!ins) return
    totalSpend += ins.spend
    totalImpressions += ins.impressions
    totalClicks += ins.clicks
    totalConversions += ins.conversions
    totalRevenue += ins.revenue
    totalReach += ins.reach
  })

  const avgFrequency = totalReach > 0 ? totalImpressions / totalReach : 0

  return {
    spend: totalSpend,
    impressions: totalImpressions,
    clicks: totalClicks,
    conversions: totalConversions,
    revenue: totalRevenue,
    reach: totalReach,
    frequency: avgFrequency,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    cpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
    roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
  }
}
