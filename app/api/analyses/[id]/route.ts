import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const serviceClient = createServiceClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: analysis } = await serviceClient
      .from('analyses')
      .select('created_by')
      .eq('id', id)
      .single()

    if (!analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (analysis.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { date_range_start, date_range_end } = body

    if (!date_range_start || !date_range_end) {
      return NextResponse.json({ error: 'Dates required' }, { status: 400 })
    }

    // Clear previous results and insights so re-run starts fresh
    await serviceClient.from('analysis_insights').delete().eq('analysis_id', id)
    await serviceClient.from('analysis_results').delete().eq('analysis_id', id)

    // Update dates and reset status to pending
    await serviceClient
      .from('analyses')
      .update({ date_range_start, date_range_end, status: 'pending' })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const serviceClient = createServiceClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership
    const { data: analysis } = await serviceClient
      .from('analyses')
      .select('created_by')
      .eq('id', id)
      .single()

    if (!analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (analysis.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Delete in dependency order
    await serviceClient.from('analysis_insights').delete().eq('analysis_id', id)
    await serviceClient.from('analysis_results').delete().eq('analysis_id', id)
    await serviceClient.from('analysis_connections').delete().eq('analysis_id', id)
    await serviceClient.from('analyses').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
