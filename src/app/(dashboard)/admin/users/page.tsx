'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const DEPARTMENTS = ['Reception', 'Surgical', 'Pharmacy']
const ROLES = ['worker', 'admin']

interface UserProfile {
  id: string
  full_name: string
  department: string
  role: string
}

export default function UsersPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    department: '',
    role: 'worker',
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') { router.replace('/worker'); return }

      // Fetch existing users
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, full_name, department, role')
        .order('full_name')

      setUsers(allUsers || [])
      setIsAuthLoading(false)
    }
    init()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      setSuccess(`User "${data.user.full_name}" created successfully! They can now login with ${data.user.email}`)
      setUsers(prev => [...prev, {
        id: data.user.id,
        full_name: data.user.full_name,
        department: data.user.department,
        role: data.user.role,
      }])
      setForm({ full_name: '', email: '', password: '', department: '', role: 'worker' })
      setTimeout(() => setSuccess(''), 6000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-[#0f2744] border-t-transparent animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500 ease-out">

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Manage Users
        </h1>
        <p className="text-slate-500 text-sm mt-1.5 font-medium">
          Create accounts for hospital staff and manage existing users
        </p>
      </div>

      {/* Add User Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800">Add New User</h2>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium flex items-start gap-2">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-100 text-sm font-medium flex items-start gap-2">
            <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                required
                placeholder="Dr. Ramesh Kumar"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 focus:border-[#0f2744] transition-all bg-slate-50 hover:bg-white"
              />
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                placeholder="ramesh@gkhospitals.in"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 focus:border-[#0f2744] transition-all bg-slate-50 hover:bg-white"
              />
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <input
                type="text"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 focus:border-[#0f2744] transition-all bg-slate-50 hover:bg-white"
              />
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
              <select
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 focus:border-[#0f2744] transition-all bg-slate-50 hover:bg-white appearance-none"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Role</label>
            <div className="flex gap-4">
              {ROLES.map(r => (
                <label key={r} className="flex items-center gap-2 cursor-pointer group/radio">
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={form.role === r}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-4 h-4 text-[#0f2744] focus:ring-[#0f2744]/20"
                  />
                  <span className="text-sm font-medium text-slate-700 capitalize group-hover/radio:text-[#0f2744] transition-colors">
                    {r}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0f2744] hover:bg-[#1a385b] text-white py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create User Account</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Existing Users List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Existing Users</h2>
          <span className="text-xs font-semibold bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full shadow-sm">
            {users.length} Users
          </span>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr key={u.id} className={i % 2 === 0 ? 'bg-white hover:bg-slate-50/80 transition-colors' : 'bg-slate-50/40 hover:bg-slate-50/80 transition-colors'}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{u.full_name || 'Unnamed'}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200/60">
                        {u.department || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        u.role === 'admin'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
