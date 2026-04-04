'use client'

import { useState } from 'react'
import { format } from 'date-fns'

interface Budget {
  id: string
  department: string
  monthly_limit: number
  month: string
  year: number
}

interface AdminProfile {
  id: string
  full_name: string
}

export default function BudgetClient({ 
  budgets: initialBudgets, 
  adminProfile 
}: { 
  budgets: Budget[]
  adminProfile: AdminProfile
}) {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets)

  const currentMonth = format(new Date(), 'MMMM')
  const currentYear = new Date().getFullYear().toString()

  const [department, setDepartment] = useState('Reception')
  const [monthlyLimit, setMonthlyLimit] = useState('')
  const [month, setMonth] = useState(currentMonth)
  const [year, setYear] = useState(currentYear)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const DEPARTMENTS = ['Reception', 'Surgical', 'Pharmacy']
  
  // Future 5 years options
  const YEARS = Array.from({ length: 6 }, (_, i) => String(parseInt(currentYear) + i - 1))

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/set-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department, monthlyLimit: Number(monthlyLimit), month, year: Number(year) }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to set budget')
      }

      setSuccess('Budget updated successfully!')
      setMonthlyLimit('')
      
      // Update local state (it's an upsert so either replace or add)
      setBudgets(prev => {
        const existingIdx = prev.findIndex(b => b.department === data.budget.department && b.month === data.budget.month && b.year === data.budget.year)
        if (existingIdx >= 0) {
          const newBudgets = [...prev]
          newBudgets[existingIdx] = data.budget
          return newBudgets
        }
        return [data.budget, ...prev]
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-4xl">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Set Department Budget</h2>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">{success}</div>}

        <form onSubmit={handleSetBudget} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]"
            >
              {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]"
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Monthly Limit (₹)</label>
            <input
              type="number"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              required
              min="1"
              placeholder="e.g. 50000"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]"
            />
          </div>

          <div className="lg:col-span-4 pt-2 border-t border-slate-100 mt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#0f2744] text-white text-sm font-medium rounded-lg hover:bg-[#0f2744]/90 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Set Budget'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-4xl">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Budget History</h2>
        
        {budgets.length === 0 ? (
          <p className="text-slate-500 text-sm">No budgets configured.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-sm font-medium text-slate-500">Department</th>
                  <th className="py-3 px-4 text-sm font-medium text-slate-500">Period</th>
                  <th className="py-3 px-4 text-sm font-medium text-slate-500 text-right">Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {budgets.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 text-sm text-slate-800 font-medium">{b.department}</td>
                    <td className="py-4 px-4 text-sm text-slate-600">{b.month} {b.year}</td>
                    <td className="py-4 px-4 text-sm font-bold text-slate-800 text-right">₹{b.monthly_limit.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
