import { NextRequest, NextResponse } from 'next/server'
import { getMetaAdAccounts } from '@/lib/api/meta'

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    const accounts = await getMetaAdAccounts(accessToken)

    return NextResponse.json({ accounts })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch Meta accounts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
