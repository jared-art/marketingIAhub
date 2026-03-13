const SOURCE_LABELS: Record<string, string> = {
  PAID_SOCIAL: 'Social de pago',
  PAID_SEARCH: 'Búsqueda de pago',
  ORGANIC_SOCIAL: 'Social orgánico',
  ORGANIC_SEARCH: 'Búsqueda orgánica',
  EMAIL_MARKETING: 'Email marketing',
  DIRECT_TRAFFIC: 'Tráfico directo',
  REFERRALS: 'Referidos',
  OTHER_CAMPAIGNS: 'Otras campañas',
  OFFLINE: 'Offline',
}

export interface HubSpotAttribution {
  source: string
  label: string
  count: number
  revenue: number
}

export async function verifyHubSpotToken(token: string) {
  const res = await fetch('https://api.hubapi.com/account-info/v3/details', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Invalid HubSpot token')
  return res.json()
}

export async function getHubSpotContacts(token: string, since?: string, until?: string) {
  const contacts: unknown[] = []
  let after: string | undefined

  // Always slice to YYYY-MM-DD to avoid invalid concatenation if dates have time components
  const filters =
    since && until
      ? [
          {
            propertyName: 'createdate',
            operator: 'BETWEEN',
            value: new Date(since.slice(0, 10) + 'T00:00:00.000Z').getTime().toString(),
            highValue: new Date(until.slice(0, 10) + 'T23:59:59.999Z').getTime().toString(),
          },
        ]
      : []

  const body = {
    filterGroups: filters.length ? [{ filters }] : [],
    properties: ['email', 'firstname', 'lastname', 'createdate', 'hs_lead_status', 'hs_analytics_source'],
    limit: 100,
    sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
  }

  let page = 0
  while (page < 20) {
    const bodyWithCursor = after ? { ...body, after } : body
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyWithCursor),
    })
    if (!res.ok) throw new Error(`HubSpot contacts error: ${res.status}`)
    const data = await res.json()
    contacts.push(...(data.results || []))
    if (!data.paging?.next?.after) break
    after = data.paging.next.after
    page++
  }

  return contacts
}

export async function getHubSpotDeals(token: string, since?: string, until?: string) {
  const deals: unknown[] = []
  let after: string | undefined

  const filterGroups =
    since && until
      ? [
          // Deals created in range
          {
            filters: [
              {
                propertyName: 'createdate',
                operator: 'BETWEEN',
                value: new Date(since.slice(0, 10) + 'T00:00:00.000Z').getTime().toString(),
                highValue: new Date(until.slice(0, 10) + 'T23:59:59.999Z').getTime().toString(),
              },
            ],
          },
          // OR deals closed in range
          {
            filters: [
              {
                propertyName: 'closedate',
                operator: 'BETWEEN',
                value: new Date(since.slice(0, 10) + 'T00:00:00.000Z').getTime().toString(),
                highValue: new Date(until.slice(0, 10) + 'T23:59:59.999Z').getTime().toString(),
              },
            ],
          },
        ]
      : []

  const body = {
    filterGroups,
    properties: [
      'dealname',
      'amount',
      'closedate',
      'dealstage',
      'pipeline',
      'createdate',
      'hubspot_owner_id',
      'hs_analytics_source',
      'hs_analytics_source_data_1',
      'hs_analytics_source_data_2',
    ],
    limit: 100,
    sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
  }

  let page = 0
  while (page < 20) {
    const bodyWithCursor = after ? { ...body, after } : body
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyWithCursor),
    })
    if (!res.ok) throw new Error(`HubSpot deals error: ${res.status}`)
    const data = await res.json()
    deals.push(...(data.results || []))
    if (!data.paging?.next?.after) break
    after = data.paging.next.after
    page++
  }

  return deals
}

// Try to fetch HubSpot marketing campaigns (requires Marketing Hub Pro+)
export async function getHubSpotCampaigns(token: string) {
  try {
    const res = await fetch(
      'https://api.hubapi.com/marketing/v3/campaigns?limit=50&sort=-startDate',
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.results || []
  } catch {
    return []
  }
}

export function computeHubSpotSummary(
  contacts: unknown[],
  deals: unknown[],
  since?: string,
  until?: string
) {
  const typedDeals = deals as { properties?: Record<string, string> }[]

  // Normalize ISO datetime to YYYY-MM-DD for reliable string comparison
  const nd = (d: string | undefined) => d?.slice(0, 10)

  // Deals within the date range (created OR closed in range)
  const dealsInRange =
    since && until
      ? typedDeals.filter((d) => {
          const cd = nd(d.properties?.createdate)
          const cl = nd(d.properties?.closedate)
          return (cd && cd >= since && cd <= until) || (cl && cl >= since && cl <= until)
        })
      : typedDeals

  const closedWonDeals = typedDeals.filter((d) => d.properties?.dealstage === 'closedwon')

  const closedWonInRange =
    since && until
      ? closedWonDeals.filter((d) => {
          const cl = nd(d.properties?.closedate)
          const cd = nd(d.properties?.createdate)
          // Prefer closedate; fall back to createdate if closedate is missing
          if (cl) return cl >= since && cl <= until
          return cd ? cd >= since && cd <= until : false
        })
      : closedWonDeals

  const totalRevenue = closedWonInRange.reduce(
    (sum, d) => sum + parseFloat(d.properties?.amount || '0'),
    0
  )

  const openDeals = dealsInRange.filter(
    (d) =>
      d.properties?.dealstage !== 'closedwon' && d.properties?.dealstage !== 'closedlost'
  )
  const totalPipeline = openDeals.reduce(
    (sum, d) => sum + parseFloat(d.properties?.amount || '0'),
    0
  )

  // Attribution: group closed won deals by traffic source
  const sourceMap: Record<string, { count: number; revenue: number }> = {}
  closedWonInRange.forEach((d) => {
    const source = d.properties?.hs_analytics_source || 'UNKNOWN'
    if (!sourceMap[source]) sourceMap[source] = { count: 0, revenue: 0 }
    sourceMap[source].count++
    sourceMap[source].revenue += parseFloat(d.properties?.amount || '0')
  })

  // Also group contacts by source for lead attribution
  const contactSourceMap: Record<string, number> = {}
  const typedContacts = contacts as { properties?: Record<string, string> }[]
  typedContacts.forEach((c) => {
    const source = c.properties?.hs_analytics_source || 'UNKNOWN'
    contactSourceMap[source] = (contactSourceMap[source] || 0) + 1
  })

  const attribution: HubSpotAttribution[] = Object.entries(sourceMap)
    .map(([source, data]) => ({
      source,
      label: SOURCE_LABELS[source] || source,
      count: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  const leadAttribution: HubSpotAttribution[] = Object.entries(contactSourceMap)
    .map(([source, count]) => ({
      source,
      label: SOURCE_LABELS[source] || source,
      count,
      revenue: 0,
    }))
    .sort((a, b) => b.count - a.count)

  const totalLeads = contacts.length
  const conversionRate = totalLeads > 0 ? (closedWonInRange.length / totalLeads) * 100 : 0

  return {
    totalLeads,
    totalDeals: dealsInRange.length,
    openDeals: openDeals.length,
    closedDeals: closedWonInRange.length,
    totalRevenue,
    totalPipeline,
    conversionRate,
    avgDealValue: closedWonInRange.length > 0 ? totalRevenue / closedWonInRange.length : 0,
    attribution,        // revenue attribution by source
    leadAttribution,    // lead count by source
  }
}
