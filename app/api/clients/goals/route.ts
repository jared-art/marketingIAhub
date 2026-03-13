import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceClient = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { analysis_id, leads_goal, conversion_goal, revenue_goal } = await request.json()
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
      .from('client_goals')
      .upsert(
        {
          analysis_id,
          leads_goal: leads_goal != null ? Number(leads_goal) : null,
          conversion_goal: conversion_goal != null ? Number(conversion_goal) : null,
          revenue_goal: revenue_goal != null ? Number(revenue_goal) : null,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'analysis_id' }
      )

    if (error) {
      console.error('[goals POST] Supabase error:', JSON.stringify(error))
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[goals POST] catch:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
