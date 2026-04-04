'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Employee {
  id: string
  full_name: string
  role: string
  department: string
  salary: number
  join_date: string
}

interface Payment {
  id: string
  employee_id: string
  amount: number
  month: string
  year: number
  paid_at: string
}

interface AdminProfile {
  id: string
  full_name: string
}

export default function SalaryClient({ 
  employees: initialEmployees, 
  payments: initialPayments,
  adminProfile,
  currentMonth,
  currentYear
}: { 
  employees: Employee[]
  payments: Payment[]
  adminProfile: AdminProfile
  currentMonth: string
  currentYear: number
}) {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [payments, setPayments] = useState<Payment[]>(initialPayments)

  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('')
  const [department, setDepartment] = useState('Reception')
  const [salary, setSalary] = useState('')
  const [joinDate, setJoinDate] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, role, department, salary: Number(salary), joinDate }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add employee')
      }

      setSuccess('Employee added successfully!')
      setFullName('')
      setRole('')
      setDepartment('Reception')
      setSalary('')
      setJoinDate('')
      
      setEmployees(prev => [data.employee, ...prev])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (employee: Employee) => {
    if (!window.confirm(`Mark ₹${employee.salary} as paid for ${employee.full_name}?`)) return
    
    setActionLoading(employee.id)
    try {
      const res = await fetch('/api/admin/mark-salary-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employeeId: employee.id, 
          month: currentMonth, 
          year: currentYear 
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to mark as paid')
      }

      setPayments(prev => [...prev, data.payment])
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Add New Employee</h2>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">{success}</div>}

        <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Role / Position</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              placeholder="e.g. Head Nurse"
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

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Monthly Salary (₹)</label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              required
              min="1"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Join Date</label>
            <input
              type="date"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#0f2744] text-white text-sm font-medium rounded-lg hover:bg-[#0f2744]/90 transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-800">Employee Salaries</h2>
          <span className="text-sm font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
            {currentMonth} {currentYear}
          </span>
        </div>
        
        {employees.length === 0 ? (
          <p className="text-slate-500 text-sm">No employees configured.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-sm font-medium text-slate-500">Name</th>
                  <th className="py-3 px-4 text-sm font-medium text-slate-500">Department</th>
                  <th className="py-3 px-4 text-sm font-medium text-slate-500">Role</th>
                  <th className="py-3 px-4 text-sm font-medium text-slate-500">Salary</th>
                  <th className="py-3 px-4 text-sm font-medium text-slate-500 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => {
                  const isPaid = payments.some(p => p.employee_id === emp.id)

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-4 text-sm text-slate-800 font-medium">{emp.full_name}</td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200/60">
                          {emp.department}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">{emp.role}</td>
                      <td className="py-4 px-4 text-sm font-bold text-slate-800">₹{emp.salary.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-4 text-right">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-semibold">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            Paid
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMarkPaid(emp)}
                            disabled={actionLoading === emp.id}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg transition disabled:opacity-50"
                          >
                            {actionLoading === emp.id ? 'Processing...' : 'Mark as Paid'}
                          </button>
                        )}
                      </td>
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
