import { NextRequest, NextResponse } from 'next/server'
import { refreshGoogleAccessToken } from '@/lib/api/google-ads'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, refreshToken, customerId, loginCustomerId } = body

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID es obligatorio' }, { status: 400 })
    }
    if (!accessToken && !refreshToken) {
      return NextResponse.json({ error: 'Access Token o Refresh Token son obligatorios' }, { status: 400 })
    }

    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    if (!developerToken) {
      return NextResponse.json({ error: 'Developer Token no configurado en el servidor' }, { status: 500 })
    }

    // Resolve final access token
    let resolvedToken = accessToken
    if (refreshToken) {
      resolvedToken = await refreshGoogleAccessToken(refreshToken)
    }

    const cleanCustomerId = customerId.replace(/-/g, '')
    const cleanLoginId = (loginCustomerId || customerId).replace(/-/g, '')

    const url = `https://googleads.googleapis.com/v17/customers/${cleanCustomerId}/googleAds:search`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resolvedToken}`,
        'developer-token': developerToken,
        'login-customer-id': cleanLoginId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'SELECT customer.descriptive_name, customer.id FROM customer LIMIT 1',
      }),
    })

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      throw new Error('Token expirado o credenciales inválidas')
    }

    const data = await res.json()
    if (!res.ok) {
      const msg = data?.error?.details?.[0]?.errors?.[0]?.message
        || data?.error?.message
        || 'Error al verificar Google Ads'
      throw new Error(msg)
    }

    const customer = data.results?.[0]?.customer
    return NextResponse.json({
      success: true,
      customerId: cleanCustomerId,
      customerName: customer?.descriptiveName || `Cuenta ${customerId}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al verificar Google Ads'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
