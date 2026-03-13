import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/dashboard/LogoutButton'
import { ClientsManager } from '@/components/clients/ClientsManager'
import type { Analysis, AnalysisConnection, AnalysisResult } from '@/types'

interface AnalysisWithConnections extends Analysis {
  analysis_connections: AnalysisConnection[]
}

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: allowedUser } = await supabase
    .from('allowed_users')
    .select('role, email')
    .eq('auth_user_id', user.id)
    .single()

  const { data: analyses } = await supabase
    .from('analyses')
    .select('*, analysis_connections(*)')
    .order('created_at', { ascending: false })

  const { data: clients } = await supabase
    .from('clients')
    .select('analysis_id, client_name')
    .eq('created_by', user.id)

  const clientAnalysisIds = (clients || []).map((c: { analysis_id: string }) => c.analysis_id)
  let clientResults: AnalysisResult[] = []
  let goalsMap: Record<string, { leads_goal: number | null; conversion_goal: number | null; revenue_goal: number | null }> = {}

  if (clientAnalysisIds.length > 0) {
    const [{ data: resultsData }, { data: goalsData }] = await Promise.all([
      supabase.from('analysis_results').select('*').in('analysis_id', clientAnalysisIds),
      supabase.from('client_goals').select('analysis_id, leads_goal, conversion_goal, revenue_goal').in('analysis_id', clientAnalysisIds),
    ])
    clientResults = (resultsData || []) as AnalysisResult[]
    goalsMap = Object.fromEntries(
      (goalsData || []).map((g: { analysis_id: string; leads_goal: number | null; conversion_goal: number | null; revenue_goal: number | null }) => [
        g.analysis_id,
        { leads_goal: g.leads_goal, conversion_goal: g.conversion_goal, revenue_goal: g.revenue_goal },
      ])
    )
  }

  const displayName = allowedUser?.email?.split('@')[0] || 'Usuario'
  const typedAnalyses = (analyses || []) as unknown as AnalysisWithConnections[]
  const clientMap = new Map((clients || []).map((c: { analysis_id: string; client_name: string | null }) => [c.analysis_id, c.client_name]))

  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      {/* Header */}
      <header className="border-b border-[#1F2937] bg-[#0A0F1E]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AdIntel
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link href="/dashboard" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Análisis
              </Link>
              <Link href="/clients" className="px-3 py-1.5 text-sm text-white bg-white/8 rounded-lg font-medium">
                Clientes
              </Link>
              <Link href="/tokens" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Credenciales
              </Link>
              {allowedUser?.role === 'admin' && (
                <Link href="/admin" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <span className="text-indigo-400 text-xs font-medium">{displayName[0]?.toUpperCase()}</span>
              </div>
              <span>{displayName}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-gray-400 text-sm mt-1">
            Marca análisis como clientes de la agencia para el futuro dashboard global.
          </p>
        </div>

        <ClientsManager
          analyses={typedAnalyses}
          clientMap={Object.fromEntries(clientMap)}
          clientResults={clientResults}
          goalsMap={goalsMap}
        />
      </main>
    </div>
  )
}
