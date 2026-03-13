import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UserManagement } from '@/components/admin/UserManagement'
import { LogoutButton } from '@/components/dashboard/LogoutButton'
import type { AllowedUser } from '@/types'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify admin role
  const { data: allowedUser } = await supabase
    .from('allowed_users')
    .select('role, email')
    .eq('auth_user_id', user.id)
    .single()

  if (!allowedUser || allowedUser.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get all users
  const { data: users } = await supabase
    .from('allowed_users')
    .select('*')
    .order('invited_at', { ascending: false })

  const typedUsers = (users || []) as AllowedUser[]

  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      {/* Header */}
      <header className="border-b border-[#1F2937] bg-[#0A0F1E]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AdIntel
              </span>
              <span className="text-gray-600">/</span>
              <span className="text-gray-300 text-sm font-medium">Administración</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-full">Admin</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Gestión de usuarios</h1>
          <p className="text-gray-400 text-sm">
            Administra los usuarios con acceso a AdIntel. Solo los emails de la lista pueden iniciar sesión.
          </p>
        </div>

        <UserManagement initialUsers={typedUsers} currentUserId={user.id} />
      </main>
    </div>
  )
}
