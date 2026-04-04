'use client'

import { useState, useMemo } from 'react'
import { format, isSameWeek, isSameMonth, parseISO } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts'

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

interface Appointment {
  id: string
  patient_name: string
  phone: string
  department: string | null
  preferred_date: string | null
  message: string | null
  created_at: string
}

interface Budget {
  id: string
  department: string
  monthly_limit: number
  month: string
  year: number
}

interface Profile {
  id: string
  full_name: string
  role: string
  department: string
}

const ALL_CATEGORIES = [
  'Medical Supplies',
  'Medicines',
  'Fuel and Transport',
  'Staff Wages',
  'Utilities',
  'Food and Canteen',
  'Equipment Maintenance',
  'Miscellaneous',
]

const ALL_DEPARTMENTS = [
  'Reception',
  'Surgical',
  'Pharmacy',
]

const PIE_COLORS = ['#0f2744', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminClient({
  profile,
  initialExpenses,
  initialAppointments,
  initialBudgets,
}: {
  profile: Profile
  initialExpenses: Expense[]
  initialAppointments: Appointment[]
  initialBudgets: Budget[]
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  
  const [filterSearch, setFilterSearch] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  
  const [activeTab, setActiveTab] = useState<'expenses' | 'appointments'>('expenses')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // KPI calculations
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  const todayTotal = expenses
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0)

  const weekTotal = expenses
    .filter(e => isSameWeek(parseISO(e.date), today, { weekStartsOn: 1 }))
    .reduce((sum, e) => sum + e.amount, 0)

  const monthExpenses = expenses.filter(e => isSameMonth(parseISO(e.date), today))

  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const monthEntriesCount = monthExpenses.length

  // Bar Chart Data (By Category)
  const categoryChartData = useMemo(() => {
    const categoriesMap: Record<string, number> = {}
    monthExpenses.forEach(e => {
      categoriesMap[e.category] = (categoriesMap[e.category] || 0) + e.amount
    })

    return Object.entries(categoriesMap)
      .map(([name, amount]) => ({
        name: name.length > 10 ? name.split(' ')[0] : name,
        amount,
        fullName: name,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [monthExpenses])

  // Pie Chart Data (By Department)
  const departmentChartData = useMemo(() => {
    const deptMap: Record<string, number> = {}
    monthExpenses.forEach(e => {
      const d = e.department || 'Unknown'
      deptMap[d] = (deptMap[d] || 0) + e.amount
    })

    return Object.entries(deptMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [monthExpenses])

  // Trend Chart Data (Last 6 Months)
  const trendChartData = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      months.push(format(d, 'MMM yyyy'))
    }

    const trendMap: Record<string, number> = {}
    months.forEach(m => trendMap[m] = 0)

    expenses.forEach(e => {
      const expenseMonth = format(parseISO(e.date), 'MMM yyyy')
      if (trendMap[expenseMonth] !== undefined) {
        trendMap[expenseMonth] += e.amount
      }
    })

    return months.map(m => {
      const shortName = m.split(' ')[0]
      return {
        name: m,
        shortName,
        amount: trendMap[m]
      }
    })
  }, [expenses])

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      let pass = true
      
      if (filterSearch) {
        const query = filterSearch.toLowerCase()
        const matchesDesc = e.description?.toLowerCase().includes(query)
        const matchesName = e.added_by_name?.toLowerCase().includes(query)
        if (!matchesDesc && !matchesName) pass = false
      }
      
      if (filterDateFrom && e.date < filterDateFrom) pass = false
      if (filterDateTo && e.date > filterDateTo) pass = false
      if (filterCategory && e.category !== filterCategory) pass = false
      if (filterDepartment && e.department !== filterDepartment) pass = false
      return pass
    })
  }, [expenses, filterSearch, filterDateFrom, filterDateTo, filterCategory, filterDepartment])

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record? This cannot be undone.')) {
      return
    }

    setIsDeleting(id)
    try {
      const res = await fetch(`/api/admin/expenses/${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete expense')
      }

      setExpenses(prev => prev.filter(e => e.id !== id))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500 ease-out">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Admin Overview
        </h1>
        <p className="text-slate-500 text-sm mt-1.5 font-medium">
          Global hospital expenses, appointments, and performance analytics
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Today's total spend", value: `₹${todayTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
          { label: "This week's total", value: `₹${weekTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
          { label: "This month's total", value: `₹${monthTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
          { label: "Entries this month", value: monthEntriesCount.toLocaleString('en-IN') }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-slate-500 font-medium mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-800 tabular-nums tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* DEPARTMENT BUDGETS */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-4">Department Budgets ({format(today, 'MMMM yyyy')})</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ALL_DEPARTMENTS.map(dept => {
            const budget = initialBudgets.find(b => b.department === dept)
            
            // Calculate spent amount for Department this month
            const spent = monthExpenses.filter(e => e.department === dept).reduce((sum, e) => sum + e.amount, 0)
            
            if (!budget) {
              return (
                <div key={dept} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">{dept}</h3>
                    <p className="text-slate-400 text-sm italic mb-4">No budget set for {format(today, 'MMM yyyy')}</p>
                  </div>
                  <a href="/admin/budget" className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 w-max">
                    Set Budget
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              )
            }

            const limit = budget.monthly_limit
            const percentageRaw = limit > 0 ? (spent / limit) * 100 : 0
            const percentage = Math.min(percentageRaw, 100)
            
            let colorClass = 'bg-emerald-500' // green
            let textClass = 'text-emerald-500' // green
            if (percentageRaw >= 90) {
              colorClass = 'bg-red-500'
              textClass = 'text-red-500'
            } else if (percentageRaw >= 75) {
              colorClass = 'bg-amber-500'
              textClass = 'text-amber-500'
            }

            return (
              <div key={dept} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{dept}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-50 ${textClass}`}>
                    {percentageRaw.toFixed(1)}% Used
                  </span>
                </div>
                
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-slate-800 tracking-tight">₹{spent.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-slate-500 font-medium">/ ₹{limit.toLocaleString('en-IN')}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                  <div className={`h-2 rounded-full ${colorClass} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                </div>
                
                {percentageRaw >= 100 && (
                  <p className="text-xs text-red-500 mt-2 font-medium">Over budget limit!</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-8 max-w-xs">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'expenses'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
            activeTab === 'appointments'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Appointments
          {initialAppointments.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {initialAppointments.length}
            </span>
          )}
        </button>
      </div>

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <>
          {/* FILTERS ROW */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <h2 className="text-base font-semibold text-slate-800">Filter Logbook</h2>
              <div className="relative w-full sm:w-64">
                <input 
                  type="text"
                  placeholder="Search description or name..."
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 transition-all bg-slate-50 hover:bg-white"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date From</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={e => setFilterDateFrom(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 transition-all bg-slate-50 hover:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date To</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={e => setFilterDateTo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 transition-all bg-slate-50 hover:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 transition-all bg-slate-50 hover:bg-white appearance-none"
                >
                  <option value="">All Categories</option>
                  {ALL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                <select
                  value={filterDepartment}
                  onChange={e => setFilterDepartment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 transition-all bg-slate-50 hover:bg-white appearance-none"
                >
                  <option value="">All Departments</option>
                  {ALL_DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* EXPENSES TABLE */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[800px]">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                <h2 className="text-base font-bold text-slate-800">Expense Records</h2>
                <span className="text-xs font-semibold bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full shadow-sm">{filteredExpenses.length} Records</span>
              </div>

              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50 ring-1 ring-slate-100 z-10">
                    <tr>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Date</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Dept</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Added By</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Category</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right bg-slate-50">Amount</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Description</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 text-center">Actions</th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 text-center">Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
                          <div className="w-12 h-12 bg-slate-50 mx-auto rounded-full flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-slate-500">No records found</p>
                          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query</p>
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((expense, i) => (
                        <tr key={expense.id} className={i % 2 === 0 ? 'bg-white hover:bg-slate-50/80 transition-colors' : 'bg-slate-50/40 hover:bg-slate-50/80 transition-colors'}>
                          <td className="px-4 py-4 whitespace-nowrap text-[12px] text-slate-500 font-medium">
                            {format(parseISO(expense.date), 'dd MMM yy')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md border border-slate-200/60">
                              {expense.department.substring(0, 4)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 font-medium max-w-[120px] truncate" title={expense.added_by_name}>
                            {expense.added_by_name || 'Unknown'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-[13px] text-slate-600 font-medium">
                            {expense.category}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-slate-800 tabular-nums text-right">
                            ₹{expense.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-4 text-[13px] text-slate-500 truncate max-w-[150px]" title={expense.description}>
                            {expense.description || '-'}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              disabled={isDeleting === expense.id}
                              className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 p-1 rounded-md hover:bg-red-50"
                              title="Delete Expense"
                            >
                              {isDeleting === expense.id ? (
                                <svg className="w-4 h-4 animate-spin text-red-500" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] font-medium">
                            {expense.bill_url ? (
                              <a href={expense.bill_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 hover:underline">
                                View
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CHARTS CONTAINER - STACKED ON RIGHT */}
            <div className="flex flex-col gap-6 lg:col-span-1">
              
              {/* BAR CHART */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[380px]">
                <div className="mb-4 shrink-0">
                  <h2 className="text-base font-bold text-slate-800">Category Spend</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5 uppercase tracking-wide">Current Month</p>
                </div>

                <div className="flex-1 w-full relative">
                  {categoryChartData.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-sm absolute inset-0">
                      <svg className="w-8 h-8 text-slate-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      No data this month
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" className="-ml-3">
                      <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          dy={10}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          tickFormatter={(value) => `₹${value >= 1000 ? value / 1000 + 'k' : value}`}
                          width={40}
                        />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                          labelStyle={{ fontWeight: 'bold', color: '#0f2744', marginBottom: '8px', fontSize: '13px' }}
                          itemStyle={{ color: '#0f2744', fontWeight: 'bold', fontSize: '14px' }}
                          formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                          labelFormatter={(label, payload) => payload[0]?.payload.fullName || label}
                        />
                        <Bar
                          dataKey="amount"
                          fill="#0f2744"
                          radius={[4, 4, 0, 0]}
                          barSize={24}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* PIE CHART */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[380px]">
                <div className="mb-2 shrink-0">
                  <h2 className="text-base font-bold text-slate-800">Department Spend</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5 uppercase tracking-wide">Current Month</p>
                </div>

                <div className="flex-1 w-full relative">
                  {departmentChartData.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-sm absolute inset-0">
                      <svg className="w-8 h-8 text-slate-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                      </svg>
                      No data this month
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={departmentChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {departmentChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                          formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                          itemStyle={{ color: '#0f2744', fontWeight: 'bold', fontSize: '14px' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          wrapperStyle={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}
                          iconType="circle"
                          iconSize={8}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* TREND CHART */}
          <div className="mt-10 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 w-full h-[300px] flex flex-col">
            <div className="mb-4 shrink-0">
              <h2 className="text-base font-bold text-slate-800">6 Month Spending Trend</h2>
            </div>
            
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%" className="-ml-3 mt-2">
                <LineChart data={trendChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="shortName" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    tickFormatter={(value) => `₹${value >= 1000 ? value / 1000 + 'k' : value}`}
                    width={50}
                  />
                  <Tooltip
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#0f2744', marginBottom: '8px', fontSize: '13px' }}
                    itemStyle={{ color: '#0f2744', fontWeight: 'bold', fontSize: '14px' }}
                    formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                    labelFormatter={(label, payload) => payload[0]?.payload.name || label}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#0f2744" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0f2744', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#0f2744', strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* APPOINTMENTS TAB */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Appointment Bookings</h2>
            <span className="text-xs font-semibold bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full shadow-sm">
              {initialAppointments.length} Bookings
            </span>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 ring-1 ring-slate-100 z-10">
                <tr>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Patient Name</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Phone</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Department</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Preferred Date</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Message</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="w-12 h-12 bg-slate-50 mx-auto rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-500">No appointment bookings yet</p>
                      <p className="text-xs text-slate-400 mt-1">Bookings from the website contact form will appear here</p>
                    </td>
                  </tr>
                ) : (
                  initialAppointments.map((appt, i) => (
                    <tr key={appt.id} className={i % 2 === 0 ? 'bg-white hover:bg-slate-50/80 transition-colors' : 'bg-slate-50/40 hover:bg-slate-50/80 transition-colors'}>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {appt.patient_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium tabular-nums">
                        {appt.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appt.department ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200/60">
                            {appt.department}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[13px] text-slate-500 font-medium whitespace-nowrap">
                        {appt.preferred_date ? format(parseISO(appt.preferred_date), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-6 py-4 text-[13px] text-slate-500 truncate max-w-[250px]" title={appt.message || ''}>
                        {appt.message || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {format(parseISO(appt.created_at), 'dd MMM, h:mm a')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
