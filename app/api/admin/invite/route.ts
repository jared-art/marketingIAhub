import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceClient = createServiceClient()

    // Verify current user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminUser } = await serviceClient
      .from('allowed_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const { email, role = 'analyst' } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user already exists in allowed_users
    const { data: existingUser } = await serviceClient
      .from('allowed_users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'User already has access' }, { status: 409 })
    }

    // Insert into allowed_users
    const { error: insertError } = await serviceClient.from('allowed_users').insert({
      email,
      role,
      invited_by: user.id,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Send invitation email via Supabase Auth Admin
    try {
      const { error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
        data: { role },
      })
      if (inviteError) {
        console.warn('Failed to send invite email:', inviteError.message)
        // Don't fail the whole request if email sending fails
      }
    } catch (emailErr) {
      console.warn('Email invitation error:', emailErr)
    }

    return NextResponse.json({ success: true, message: `Invitation sent to ${email}` })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
