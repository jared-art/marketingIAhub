import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, customerId } = body

    if (!token) {
      return NextResponse.json({ error: 'Token de gaql.app es obligatorio' }, { status: 400 })
    }
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID es obligatorio' }, { status: 400 })
    }

    const cleanId = customerId.replace(/-/g, '')

    const res = await fetch('https://api.gaql.app/api/google-ads/execute-query', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId: parseInt(cleanId),
        loginCustomerId: parseInt(cleanId),
        query: 'SELECT customer.descriptive_name, customer.id FROM customer LIMIT 1',
        reportAggregation: '',
      }),
    })

    const rawText = await res.text()
    console.log('[gaql.app] status:', res.status, 'body:', rawText)

    let data: Record<string, unknown> = {}
    try { data = JSON.parse(rawText) } catch { /* ignored */ }

    if (!res.ok) {
      const msg = (data?.error as { message?: string })?.message || (data?.message as string) || rawText || 'Token inválido o cuenta no encontrada'
      throw new Error(`gaql.app ${res.status}: ${msg}`)
    }

    const results = (data.results as unknown[]) || []
    const customer = (results[0] as { customer?: { descriptiveName?: string } })?.customer
    return NextResponse.json({
      success: true,
      customerId: cleanId,
      customerName: customer?.descriptiveName || `Cuenta ${customerId}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al verificar Google Ads'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
