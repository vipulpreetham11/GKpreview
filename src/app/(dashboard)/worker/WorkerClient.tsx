'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

const CATEGORIES = [
  'Medical Supplies',
  'Medicines',
  'Fuel and Transport',
  'Staff Wages',
  'Utilities',
  'Food and Canteen',
  'Equipment Maintenance',
  'Miscellaneous',
]

interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
  department: string
  added_by_name: string
  bill_url?: string | null
  created_at: string
}

interface Profile {
  id: string
  full_name: string
  role: string
  department: string
}

export default function WorkerClient({
  profile,
  initialExpenses,
}: {
  profile: Profile
  initialExpenses: Expense[]
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    amount: '',
    description: '',
  })
  const [billFile, setBillFile] = useState<File | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const supabase = createClient()
    let bill_url = null

    if (billFile) {
      const ext = billFile.name.split('.').pop()
      const randomId = Math.random().toString(36).substring(2, 9)
      const filePath = `${profile.id}/${form.date}-${randomId}.${ext}`
      
      const { error: uploadError } = await supabase.storage
        .from('bills')
        .upload(filePath, billFile)
        
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('bills').getPublicUrl(filePath)
        bill_url = publicUrlData.publicUrl
      } else {
        setError('Failed to upload bill. Please try again.')
        setLoading(false)
        return
      }
    }

    const { data, error: insertError } = await supabase
      .from('expenses')
      .insert({
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description,
        date: form.date,
        department: profile.department,
        added_by: profile.id,
        added_by_name: profile.full_name,
        bill_url,
      })
      .select()
      .single()

    if (insertError) {
      setError('Failed to add expense. Please try again.')
      setLoading(false)
      return
    }

    await supabase.from('audit_logs').insert({
      action: 'expense_created',
      performed_by: profile.id,
      performed_by_name: profile.full_name,
      target_type: 'expense',
      target_id: data.id,
      details: { amount: parseFloat(form.amount), category: form.category, department: profile.department }
    })

    setExpenses([data, ...expenses])
    setForm({
      date: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      amount: '',
      description: '',
    })
    setBillFile(null)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setLoading(false)
  }

  const totalThisMonth = expenses
    .filter(e => e.date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">

      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0f2744] to-[#3b82f6]">{profile.full_name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium flex items-center gap-2">
            <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-slate-200/50">
              {profile.department} Department
            </span>
            Log your expenses below
          </p>
        </div>
      </div>

      {/* Quick stat */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f2744] via-[#173559] to-[#0f2744] rounded-2xl p-8 mb-10 shadow-lg shadow-[#0f2744]/20 border border-white/10">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-[#3b82f6]/10 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <svg className="w-5 h-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white/80 font-medium text-sm tracking-wide uppercase">Your spend this month</p>
          </div>
          <p className="text-5xl font-extrabold mt-3 text-white tracking-tight">
            ₹{totalThisMonth.toLocaleString('en-IN')}
          </p>
          <p className="text-white/60 text-sm mt-3 font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            {expenses.filter(e => e.date.startsWith(format(new Date(), 'yyyy-MM'))).length} recorded entries
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-10 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800">Add New Expense</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-[#0f2744] transition-colors">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 focus:border-[#0f2744] transition-all bg-slate-50/50 hover:bg-slate-50"
              />
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-[#0f2744] transition-colors">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 focus:border-[#0f2744] transition-all bg-slate-50 hover:bg-white"
              >
                <option value="">Select a specific category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-[#0f2744] transition-colors">
              Amount (₹)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-medium">₹</span>
              </div>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                required
                min="1"
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 focus:border-[#0f2744] transition-all bg-slate-50/50 hover:bg-slate-50"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-[#0f2744] transition-colors">
              Description
            </label>
              <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Provide a brief explanation for this expense..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 focus:border-[#0f2744] transition-all bg-slate-50/50 hover:bg-slate-50 resize-none"
            />
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-[#0f2744] transition-colors">
              Attach Bill (optional)
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={e => setBillFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:cursor-pointer file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-[#0f2744] hover:file:bg-slate-100 transition-all border border-slate-200 rounded-xl px-0 py-0 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 focus:border-[#0f2744]"
            />
            {billFile && <p className="text-xs text-slate-500 mt-2 font-medium">Selected: {billFile.name}</p>}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg flex items-start animate-in slide-in-from-top-2">
              <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-r-lg flex items-start animate-in slide-in-from-top-2">
              <svg className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">Expense successfully recorded!</p>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f2744] hover:bg-[#15345b] text-white font-semibold py-3.5 rounded-xl text-sm shadow-md shadow-[#0f2744]/20 hover:shadow-lg hover:shadow-[#0f2744]/30 active:scale-[0.99] transition-all duration-200 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Confirm & Add Expense'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Expense list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Recent Transactions</h2>
          <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2.5 py-1 rounded-md">History</span>
        </div>

        {expenses.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">No expenses found</p>
            <p className="text-slate-400 text-sm mt-1">Your logged expenses will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {expenses.map(expense => (
              <div key={expense.id} className="group px-8 py-5 flex items-start justify-between gap-4 hover:bg-slate-50/80 transition-colors duration-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <span className="text-sm font-bold text-slate-800 group-hover:text-[#0f2744] transition-colors">{expense.category}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200/60">
                      {expense.department}
                    </span>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-slate-500 mb-2 truncate group-hover:text-slate-600 transition-colors">{expense.description}</p>
                  )}
                  <div className="flex items-center text-xs text-slate-400 font-medium gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {format(new Date(expense.date), 'MMMM d, yyyy')}
                    {expense.bill_url && (
                      <>
                        <span className="mx-1">•</span>
                        <a href={expense.bill_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 hover:underline inline-flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          View Bill
                        </a>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-extrabold text-slate-800 tabular-nums tracking-tight">
                    ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
