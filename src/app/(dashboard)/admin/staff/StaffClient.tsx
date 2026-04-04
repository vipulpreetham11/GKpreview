'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface WorkerProfile {
  id: string
  full_name: string
  username?: string
  department: string
  created_at: string
}

export default function StaffClient({ initialWorkers }: { initialWorkers: WorkerProfile[] }) {
  const router = useRouter()
  // Ensure we consistently use full_name, username, department
  const [workers, setWorkers] = useState<WorkerProfile[]>(initialWorkers)
  
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState('Reception')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/create-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, username, password, department }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create worker')
      }

      setSuccess('Worker account created successfully!')
      setFullName('')
      setUsername('')
      setPassword('')
      setDepartment('Reception')
      
      // Update staff list state without refreshing
      setWorkers(prev => [...prev, data.profile])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Create New Worker</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleCreateWorker} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Username (lowercase)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]"
            >
              <option value="Reception">Reception</option>
              <option value="Surgical">Surgical</option>
              <option value="Pharmacy">Pharmacy</option>
            </select>
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0f2744] text-white text-sm font-medium rounded-lg hover:bg-[#0f2744]/90 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Worker'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Staff List</h2>
        
        {workers.length === 0 ? (
          <p className="text-slate-500 text-sm">No staff members yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-sm font-medium text-slate-500">Full Name</th>
                  <th className="py-3 px-4 text-sm font-medium text-slate-500">Username</th>
                  <th className="py-3 px-4 text-sm font-medium text-slate-500">Department</th>
                  <th className="py-3 px-4 text-sm font-medium text-slate-500">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workers.map((worker) => {
                  const date = worker.created_at ? new Date(worker.created_at) : new Date()
                  const formattedDate = !isNaN(date.getTime()) 
                    ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
                    : 'N/A'

                  return (
                    <tr key={worker.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 text-sm text-slate-800 font-medium">{worker.full_name}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{worker.username || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                          {worker.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">{formattedDate}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
