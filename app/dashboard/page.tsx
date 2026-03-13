import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AnalysisCard } from '@/components/dashboard/AnalysisCard'
import { LogoutButton } from '@/components/dashboard/LogoutButton'
import type { Analysis, AnalysisConnection, AnalysisInsight } from '@/types'

interface AnalysisWithMeta extends Analysis {
  connections: AnalysisConnection[]
  insights: AnalysisInsight[]
  analysis_connections: AnalysisConnection[]
  analysis_insights: AnalysisInsight[]
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get allowed user info
  const { data: allowedUser } = await supabase
    .from('allowed_users')
    .select('role, email')
    .eq('auth_user_id', user.id)
    .single()

  // Get analyses with connections and insights
  const { data: analyses } = await supabase
    .from('analyses')
    .select(`
      *,
      analysis_connections(*),
      analysis_insights(id, type, severity, platform)
    `)
    .order('created_at', { ascending: false })

  const typedAnalyses = (analyses || []) as unknown as AnalysisWithMeta[]

  const displayName = allowedUser?.email?.split('@')[0] || 'Usuario'

  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      {/* Header */}
      <header className="border-b border-[#1F2937] bg-[#0A0F1E]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AdIntel
              </span>
            </div>
            <nav className="flex items-center gap-1">
              <Link href="/dashboard" className="px-3 py-1.5 text-sm text-white bg-white/8 rounded-lg font-medium">
                Análisis
              </Link>
              <Link href="/clients" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
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
                <span className="text-indigo-400 text-xs font-medium">
                  {displayName[0]?.toUpperCase()}
                </span>
              </div>
              <span>{displayName}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Mis Análisis</h1>
            <p className="text-gray-400 text-sm mt-1">
              {typedAnalyses.length > 0
                ? `${typedAnalyses.length} análisis creado${typedAnalyses.length !== 1 ? 's' : ''}`
                : 'Crea tu primer análisis publicitario'}
            </p>
          </div>
          <Link
            href="/analyses/new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Análisis
          </Link>
        </div>

        {/* Analyses grid */}
        {typedAnalyses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#111827] border border-[#1F2937] flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Sin análisis todavía</h3>
            <p className="text-gray-400 text-sm max-w-sm mb-6">
              Crea tu primer análisis conectando tus cuentas de Meta Ads, Google Ads y/o HubSpot.
            </p>
            <Link
              href="/analyses/new"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Crear primer análisis
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {typedAnalyses.map((analysis) => (
              <AnalysisCard
                key={analysis.id}
                analysis={analysis}
                connections={analysis.analysis_connections || []}
                insights={analysis.analysis_insights || []}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
