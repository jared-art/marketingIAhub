import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ExecutiveSummary } from '@/components/detail/ExecutiveSummary'
import { PlatformTabs } from '@/components/detail/PlatformTabs'
import { InsightsList } from '@/components/detail/InsightsList'
import { ActionPlan } from '@/components/detail/ActionPlan'
import { RunAnalysisButton } from '@/components/detail/RunAnalysisButton'
import { DeleteAnalysisButton } from '@/components/detail/DeleteAnalysisButton'
import { ChangeDateRangeButton } from '@/components/detail/ChangeDateRangeButton'
import type { Analysis, AnalysisConnection, AnalysisResult, AnalysisInsight } from '@/types'

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch analysis with all related data
  const { data: analysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .single()

  if (!analysis) {
    notFound()
  }

  const { data: connections } = await supabase
    .from('analysis_connections')
    .select('*')
    .eq('analysis_id', id)

  const { data: results } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('analysis_id', id)

  const { data: insights } = await supabase
    .from('analysis_insights')
    .select('*')
    .eq('analysis_id', id)
    .order('severity', { ascending: true })

  const typedAnalysis = analysis as Analysis
  const typedConnections = (connections || []) as AnalysisConnection[]
  const typedResults = (results || []) as AnalysisResult[]
  const typedInsights = (insights || []) as AnalysisInsight[]

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    running: 'Ejecutando...',
    completed: 'Completado',
    error: 'Error',
  }

  const statusColors: Record<string, string> = {
    pending: 'text-gray-400 bg-gray-400/10',
    running: 'text-blue-400 bg-blue-400/10',
    completed: 'text-emerald-400 bg-emerald-400/10',
    error: 'text-red-400 bg-red-400/10',
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      {/* Header */}
      <header className="border-b border-[#1F2937] bg-[#0A0F1E]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex-shrink-0">
                  AdIntel
                </span>
                <span className="text-gray-600">/</span>
                <h1 className="text-white font-semibold text-sm truncate">
                  {typedAnalysis.name}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <DeleteAnalysisButton analysisId={id} />
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[typedAnalysis.status]}`}
            >
              {statusLabels[typedAnalysis.status]}
            </span>
            {typedAnalysis.status === 'completed' && typedInsights.length > 0 && (
              <span className="text-xs text-gray-500">
                {typedInsights.length} insight{typedInsights.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Pending state */}
        {typedAnalysis.status === 'pending' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <polygon points="5,3 19,12 5,21 5,3" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-bold mb-2">Análisis listo para ejecutar</h2>
            <p className="text-gray-400 text-sm max-w-md mb-8">
              Las plataformas están conectadas. Lanza el análisis para extraer datos,
              calcular métricas y generar insights automáticos.
            </p>

            {/* Connections summary */}
            <div className="flex gap-3 mb-8">
              {typedConnections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center gap-2 bg-[#111827] border border-[#1F2937] rounded-lg px-3 py-2"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-gray-300 text-sm capitalize">
                    {conn.selected_account_name || conn.platform}
                  </span>
                </div>
              ))}
            </div>

            <RunAnalysisButton analysisId={id} />
          </div>
        )}

        {/* Running state */}
        {typedAnalysis.status === 'running' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full bg-blue-600/20 border border-blue-500/20 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="animate-spin w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            </div>
            <h2 className="text-white text-xl font-bold mb-2">Análisis en progreso</h2>
            <p className="text-gray-400 text-sm max-w-md">
              Extrayendo datos de las plataformas y calculando insights. Este proceso puede tomar hasta 1 minuto.
            </p>
            <div className="mt-6 flex gap-2 text-xs text-gray-500">
              <span className="animate-pulse">Procesando datos...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {typedAnalysis.status === 'error' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-bold mb-2">Error en el análisis</h2>
            <p className="text-gray-400 text-sm max-w-md mb-6">
              Hubo un error al ejecutar el análisis. Verifica las credenciales de las plataformas y vuelve a intentarlo.
            </p>
            <div className="flex items-center gap-3">
              <RunAnalysisButton analysisId={id} label="Reintentar análisis" />
              <ChangeDateRangeButton
                analysisId={id}
                currentStart={typedAnalysis.date_range_start}
                currentEnd={typedAnalysis.date_range_end}
              />
            </div>
          </div>
        )}

        {/* Completed state */}
        {typedAnalysis.status === 'completed' && (
          <div className="space-y-8">
            {/* Section: Executive Summary */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-indigo-500" />
                  <h2 className="text-lg font-bold text-white">Resumen Ejecutivo</h2>
                </div>
                <ChangeDateRangeButton
                  analysisId={id}
                  currentStart={typedAnalysis.date_range_start}
                  currentEnd={typedAnalysis.date_range_end}
                />
              </div>
              <ExecutiveSummary
                results={typedResults}
                insights={typedInsights}
                dateStart={typedAnalysis.date_range_start}
                dateEnd={typedAnalysis.date_range_end}
              />
            </section>

            {/* Section: Platform Data */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full bg-blue-500" />
                <h2 className="text-lg font-bold text-white">Datos por plataforma</h2>
              </div>
              <PlatformTabs
                connections={typedConnections}
                results={typedResults}
              />
            </section>

            {/* Two-column layout for insights and action plan */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Insights */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full bg-amber-500" />
                  <h2 className="text-lg font-bold text-white">Insights</h2>
                  <span className="text-gray-500 text-sm ml-1">({typedInsights.length})</span>
                </div>
                <InsightsList insights={typedInsights} />
              </section>

              {/* Action Plan */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full bg-emerald-500" />
                  <h2 className="text-lg font-bold text-white">Plan de Acción</h2>
                </div>
                <ActionPlan insights={typedInsights} />
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
