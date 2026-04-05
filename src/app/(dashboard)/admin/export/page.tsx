'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

export default function ExportPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isPdfExporting, setIsPdfExporting] = useState(false)
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const [error, setError] = useState<string | null>(null)
  
  // Generate a list of years from current year down to couple years ago
  const currentYear = new Date().getFullYear()
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
      if (!profile || profile.role !== 'admin') {
        router.replace('/worker')
        return
      }
      
      setIsAuthLoading(false)
    }
    checkAuth()
  }, [router, supabase])

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setError(null)
      
      // Format dates for Supabase YYYY-MM-DD
      const monthStr = selectedMonth.toString().padStart(2, '0')
      const yearStr = selectedYear.toString()
      
      const startDate = `${yearStr}-${monthStr}-01`
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
      const endDate = `${yearStr}-${monthStr}-${lastDay}`
      
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        
      if (fetchError) throw new Error(fetchError.message)
      
      if (!data || data.length === 0) {
        throw new Error(`No expenses found for ${monthStr}/${yearStr}`)
      }
      
      // Convert JSON to CSV using pure JS
      const headers = ['Date', 'Department', 'Added By', 'Category', 'Amount', 'Description']
      const rows = data.map(e => [
        e.date,
        e.department,
        e.added_by_name,
        e.category,
        e.amount,
        `"${(e.description || '').replace(/"/g, '""')}"`
      ])
      
      const csvContent = [
        headers.join(','), 
        ...rows.map(r => r.join(','))
      ].join('\n')
      
      // Trigger native browser download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `GK-Hospitals-Expenses-${yearStr}-${monthStr}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during export')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePdfExport = async () => {
    try {
      setIsPdfExporting(true)
      setError(null)
      
      const monthStr = selectedMonth.toString().padStart(2, '0')
      const yearStr = selectedYear.toString()
      const startDate = `${yearStr}-${monthStr}-01`
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
      const endDate = `${yearStr}-${monthStr}-${lastDay}`
      
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        
      if (fetchError) throw new Error(fetchError.message)
      if (!data || data.length === 0) {
        throw new Error(`No expenses found for ${monthStr}/${yearStr}`)
      }
      
      const jsPDF = (await import('jspdf')).default
      const autoTable = (await import('jspdf-autotable')).default
      
      const doc = new (jsPDF as any)()
      
      const totalSpend = data.reduce((sum, e) => sum + e.amount, 0)
      const deptSpend: Record<string, number> = {}
      data.forEach(e => {
        const d = e.department || 'Unknown'
        deptSpend[d] = (deptSpend[d] || 0) + e.amount
      })
      
      // Header
      doc.setFillColor(15, 39, 68) 
      doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('GK Hospitals - Expense Report', 14, 20)
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label
      doc.text(`${monthLabel} ${yearStr}`, 14, 28)
      
      // Summary
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Monthly Summary', 14, 45)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total Spend: Rs. ${totalSpend.toLocaleString('en-IN')}`, 14, 52)
      doc.text(`Total Entries: ${data.length}`, 14, 58)
      
      let yPos = 68
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Spend by Department', 14, yPos)
      yPos += 7
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      Object.entries(deptSpend).forEach(([dept, amount]) => {
        doc.text(`${dept}: Rs. ${amount.toLocaleString('en-IN')}`, 14, yPos)
        yPos += 6
      })
      
      yPos += 5
      
      // Table
      const headers = [['Date', 'Department', 'Added By', 'Category', 'Amount', 'Description']]
      const rows = data.map(e => [
        e.date,
        e.department,
        e.added_by_name,
        e.category,
        `Rs. ${e.amount.toLocaleString('en-IN')}`,
        e.description || '-'
      ])
      
      autoTable(doc, {
        startY: yPos,
        head: headers,
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [15, 39, 68] },
        styles: { fontSize: 8 },
        margin: { top: 10 }
      })
      
      // Footer
      const finalY = (doc as any).lastAutoTable.finalY || yPos
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      const generatedDate = new Date().toLocaleString('en-US')
      doc.text(`Generated on ${generatedDate}`, 14, finalY + 10)
      
      doc.save(`GK-Hospitals-Report-${yearStr}-${monthStr}.pdf`)
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during PDF export')
    } finally {
      setIsPdfExporting(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-[#0f2744] border-t-transparent animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto animate-in fade-in duration-500 ease-out">
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Export Expenses
        </h1>
        <p className="text-slate-500 text-sm mt-1.5 font-medium">
          Generate comprehensive CSV reports for financial accounting
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Download Month Report
        </h2>

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-100 text-sm font-medium flex items-start gap-2">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 transition-all bg-slate-50 hover:bg-white appearance-none"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 transition-all bg-slate-50 hover:bg-white appearance-none"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExport}
            disabled={isExporting || isPdfExporting}
            className="w-full bg-[#0f2744] hover:bg-[#1a385b] text-white py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download CSV</span>
              </>
            )}
          </button>

          <button
            onClick={handlePdfExport}
            disabled={isExporting || isPdfExporting}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPdfExporting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download PDF Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
