import { NextRequest, NextResponse } from 'next/server'
import { verifyHubSpotToken } from '@/lib/api/hubspot'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const portalInfo = await verifyHubSpotToken(token)

    return NextResponse.json({
      portalId: portalInfo.portalId,
      companyName: portalInfo.companyName || `Portal ${portalInfo.portalId}`,
      timeZone: portalInfo.timeZone,
      companyCurrency: portalInfo.companyCurrency,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify HubSpot token'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
