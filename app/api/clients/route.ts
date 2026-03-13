import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: clients } = await supabase
      .from('clients')
      .select('analysis_id, client_name')
      .eq('created_by', user.id)

    return NextResponse.json({ clients: clients || [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceClient = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { analysis_id, client_name } = await request.json()
    if (!analysis_id) return NextResponse.json({ error: 'analysis_id required' }, { status: 400 })

    // Verify ownership of the analysis
    const { data: analysis } = await serviceClient
      .from('analyses')
      .select('created_by')
      .eq('id', analysis_id)
      .single()

    if (!analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (analysis.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await serviceClient
      .from('clients')
      .upsert({ analysis_id, client_name: client_name || null, created_by: user.id }, { onConflict: 'analysis_id' })

    if (error) {
      console.error('[clients POST] Supabase error:', JSON.stringify(error))
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    console.error('[clients POST] catch error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
