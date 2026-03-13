import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getMetaCampaigns, computeMetaSummary, normalizeCampaigns } from '@/lib/api/meta'
import {
  runGAQLQuery,
  computeGoogleSummary,
  normalizeGoogleCampaigns,
  getGoogleKeywords,
  computeKeywordInsights,
} from '@/lib/api/google-ads'
import { getHubSpotContacts, getHubSpotDeals, computeHubSpotSummary, getHubSpotCampaigns } from '@/lib/api/hubspot'
import { calculateInsights } from '@/lib/insights/calculator'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const serviceClient = createServiceClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: analysis, error: analysisError } = await serviceClient
      .from('analyses')
      .select('*, analysis_connections(*)')
      .eq('id', id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    if (analysis.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await serviceClient.from('analyses').update({ status: 'running' }).eq('id', id)

    const connections = analysis.analysis_connections || []

    const platformData: {
      meta?: ReturnType<typeof computeMetaSummary> & { campaigns: ReturnType<typeof normalizeCampaigns> }
      google?: ReturnType<typeof computeGoogleSummary> & {
        campaigns: ReturnType<typeof normalizeGoogleCampaigns>
        keywords?: ReturnType<typeof computeKeywordInsights>
      }
      hubspot?: ReturnType<typeof computeHubSpotSummary> & { contacts: unknown[]; deals: unknown[] }
    } = {}

    for (const connection of connections) {
      try {
        // ── META ──────────────────────────────────────────────
        if (connection.platform === 'meta') {
          const creds = connection.credentials as { accessToken: string }
          const accountId = connection.selected_account_id || ''

          const rawCampaigns = await getMetaCampaigns(
            creds.accessToken,
            accountId,
            analysis.date_range_start,
            analysis.date_range_end
          )

          const summary = computeMetaSummary(rawCampaigns)
          const campaigns = normalizeCampaigns(rawCampaigns)
          platformData.meta = { ...summary, campaigns }

          await serviceClient.from('analysis_results').insert({
            analysis_id: id,
            platform: 'meta',
            data_type: 'campaigns_summary',
            raw_data: {
              summary,
              campaigns,
              campaigns_count: campaigns.length,
            },
          })
        }

        // ── GOOGLE ADS ────────────────────────────────────────
        if (connection.platform === 'google_ads') {
          const creds = connection.credentials as {
            token: string
            customerId: string
          }
          const customerId = connection.selected_account_id || creds.customerId || ''
          const googleCreds = {
            token: creds.token,
            customerId,
          }

          const gaqlResult = await runGAQLQuery(
            googleCreds,
            `SELECT
              campaign.id,
              campaign.name,
              campaign.status,
              metrics.cost_micros,
              metrics.impressions,
              metrics.clicks,
              metrics.conversions,
              metrics.conversions_value
            FROM campaign
            WHERE segments.date BETWEEN '${analysis.date_range_start}' AND '${analysis.date_range_end}'
            AND campaign.status = 'ENABLED'
            ORDER BY metrics.cost_micros DESC
            LIMIT 50`
          )

          const rawCampaigns = gaqlResult.results || []
          const summary = computeGoogleSummary(rawCampaigns)
          const campaigns = normalizeGoogleCampaigns(rawCampaigns)

          // Second query: keyword Quality Scores
          const kwResult = await getGoogleKeywords(
            googleCreds,
            analysis.date_range_start,
            analysis.date_range_end
          )
          const keywords = computeKeywordInsights(kwResult.results || [])

          platformData.google = { ...summary, campaigns, keywords }

          await serviceClient.from('analysis_results').insert({
            analysis_id: id,
            platform: 'google_ads',
            data_type: 'campaigns_summary',
            raw_data: {
              summary,
              campaigns,
              keywords,
              campaigns_count: campaigns.length,
            },
          })
        }

        // ── HUBSPOT ───────────────────────────────────────────
        if (connection.platform === 'hubspot') {
          const creds = connection.credentials as { token: string }
          const contacts = await getHubSpotContacts(
            creds.token,
            analysis.date_range_start,
            analysis.date_range_end
          )
          const deals = await getHubSpotDeals(
            creds.token,
            analysis.date_range_start,
            analysis.date_range_end
          )
          const summary = computeHubSpotSummary(
            contacts,
            deals,
            analysis.date_range_start,
            analysis.date_range_end
          )
          // Try to fetch marketing campaigns (Pro tier only, graceful fallback)
          const campaigns = await getHubSpotCampaigns(creds.token)

          platformData.hubspot = { ...summary, contacts, deals }

          await serviceClient.from('analysis_results').insert({
            analysis_id: id,
            platform: 'hubspot',
            data_type: 'crm_summary',
            raw_data: {
              summary,
              contacts_count: contacts.length,
              deals_count: deals.length,
              campaigns,
            },
          })
        }
      } catch (platformError) {
        const msg = platformError instanceof Error ? platformError.message : String(platformError)
        console.error(`[AdIntel] Error processing ${connection.platform}: ${msg}`)
        await serviceClient.from('analysis_results').insert({
          analysis_id: id,
          platform: connection.platform,
          data_type: 'error',
          raw_data: { error: msg },
        })
      }
    }

    // Calculate and save insights
    const insights = calculateInsights(
      {
        meta: platformData.meta,
        google: platformData.google,
        hubspot: platformData.hubspot,
      },
      id
    )

    if (insights.length > 0) {
      await serviceClient.from('analysis_insights').insert(insights)
    }

    await serviceClient.from('analyses').update({ status: 'completed' }).eq('id', id)

    return NextResponse.json({
      success: true,
      insightsCount: insights.length,
      platforms: Object.keys(platformData),
    })
  } catch (error) {
    console.error('Analysis run error:', error)
    const { id } = await params
    const serviceClient = createServiceClient()
    await serviceClient.from('analyses').update({ status: 'error' }).eq('id', id)
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
