'use client'

import { useState } from 'react'
import type { AllowedUser } from '@/types'
import { formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface UserManagementProps {
  initialUsers: AllowedUser[]
  currentUserId: string
}

export function UserManagement({ initialUsers, currentUserId }: UserManagementProps) {
  const [users, setUsers] = useState<AllowedUser[]>(initialUsers)
  const [showModal, setShowModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'analyst' | 'admin'>('analyst')
  const [loading, setLoading] = useState(false)
  const [revokeLoading, setRevokeLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al invitar usuario')

      setSuccess(`Invitación enviada a ${inviteEmail}`)
      setInviteEmail('')
      setInviteRole('analyst')
      setShowModal(false)

      // Refresh users list
      const refreshRes = await fetch('/api/admin/users')
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json()
        setUsers(refreshData.users || users)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (userId: string, email: string) => {
    if (!confirm(`¿Revocar acceso de ${email}? Esta acción eliminará el usuario de la lista de acceso permitido.`)) {
      return
    }

    setRevokeLoading(userId)
    try {
      const res = await fetch('/api/admin/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al revocar acceso')

      setUsers(users.filter((u) => u.id !== userId))
      setSuccess(`Acceso de ${email} revocado correctamente`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al revocar acceso')
    } finally {
      setRevokeLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{users.length}</div>
          <div className="text-gray-400 text-sm">Total usuarios</div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="text-2xl font-bold text-indigo-400">
            {users.filter((u) => u.role === 'admin').length}
          </div>
          <div className="text-gray-400 text-sm">Administradores</div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-400">
            {users.filter((u) => u.activated_at).length}
          </div>
          <div className="text-gray-400 text-sm">Cuentas activas</div>
        </div>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-emerald-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="20,6 9,17 4,12" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold">Usuarios autorizados</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-all text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Invitar usuario
        </button>
      </div>

      {/* Users table */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1F2937]">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Email</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Rol</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Estado</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Invitado</th>
                <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isCurrentUser = user.auth_user_id === currentUserId
                return (
                  <tr
                    key={user.id}
                    className="border-b border-[#1F2937] last:border-0 hover:bg-[#0A0F1E]/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-400 text-xs font-medium">
                            {user.email[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{user.email}</div>
                          {isCurrentUser && (
                            <div className="text-xs text-indigo-400">Tú</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          user.role === 'admin'
                            ? 'text-indigo-400 bg-indigo-400/10'
                            : 'text-gray-400 bg-gray-400/10'
                        )}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Analista'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          user.activated_at
                            ? 'text-emerald-400 bg-emerald-400/10'
                            : 'text-amber-400 bg-amber-400/10'
                        )}
                      >
                        {user.activated_at ? 'Activo' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-sm">
                      {user.invited_at ? formatDate(user.invited_at) : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!isCurrentUser ? (
                        <button
                          onClick={() => handleRevoke(user.id, user.email)}
                          disabled={revokeLoading === user.id}
                          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors px-3 py-1.5 rounded-md hover:bg-red-500/10"
                        >
                          {revokeLoading === user.id ? 'Revocando...' : 'Revocar acceso'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600 px-3 py-1.5">Tu cuenta</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">
                    No hay usuarios. Invita al primer usuario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold text-lg">Invitar nuevo usuario</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email del usuario
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="usuario@empresa.com"
                  className="w-full bg-[#0A0F1E] border border-[#1F2937] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Rol
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['analyst', 'admin'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setInviteRole(role)}
                      className={cn(
                        'py-2.5 px-4 rounded-lg border text-sm font-medium transition-all',
                        inviteRole === role
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-[#0A0F1E] border-[#1F2937] text-gray-400 hover:border-indigo-500/50'
                      )}
                    >
                      {role === 'analyst' ? 'Analista' : 'Administrador'}
                    </button>
                  ))}
                </div>
                <p className="text-gray-600 text-xs mt-2">
                  {inviteRole === 'admin'
                    ? 'Los administradores pueden gestionar usuarios y ver todos los análisis.'
                    : 'Los analistas pueden crear y ver sus propios análisis.'}
                </p>
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-gray-400 border border-[#1F2937] hover:border-[#374151] rounded-lg text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-all"
                >
                  {loading ? 'Enviando...' : 'Enviar invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
