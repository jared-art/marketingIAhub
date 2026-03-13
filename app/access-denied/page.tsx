'use client'

export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AccessDeniedPage() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-red-600/8 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
          <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Acceso denegado</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Tu cuenta no tiene acceso a AdIntel. Si crees que esto es un error, contacta con tu administrador para que te añada a la plataforma.
        </p>

        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 mb-6 text-left">
          <h3 className="text-white font-medium mb-2 text-sm">¿Cómo obtener acceso?</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">1.</span>
              Contacta con el administrador de tu empresa
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">2.</span>
              Pide que añadan tu email a la lista de usuarios autorizados
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">3.</span>
              Recibirás un email de invitación para activar tu cuenta
            </li>
          </ul>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-white font-medium rounded-lg py-3 transition-all duration-200"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
