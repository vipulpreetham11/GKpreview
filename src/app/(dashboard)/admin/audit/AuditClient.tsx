'use client'

import { format, parseISO } from 'date-fns'

interface AuditLog {
  id: string
  action: string
  performed_by: string
  performed_by_name: string
  target_type: string
  target_id: string
  details: any
  created_at: string
}

export default function AuditClient({ initialLogs }: { initialLogs: AuditLog[] }) {
  const formatAction = (action: string) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto animate-in fade-in duration-500 ease-out">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Audit Log</h1>
        <p className="text-slate-500 text-sm font-medium">Global system-wide activity record covering the last 100 actions automatically.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f8fafc] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Performed By</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contextual Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="w-12 h-12 bg-slate-50 mx-auto rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-500">No activity logs recorded yet</p>
                  </td>
                </tr>
              ) : (
                initialLogs.map((log, i) => (
                  <tr key={log.id} className={i % 2 === 0 ? 'bg-white hover:bg-slate-50/80 transition-colors' : 'bg-slate-50/40 hover:bg-slate-50/80 transition-colors'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium tabular-nums">
                      {format(parseISO(log.created_at), 'dd MMM yy, h:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded border border-slate-200/60 bg-slate-100 text-[10px] font-bold uppercase tracking-widest text-[#0f2744]">
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                      {log.performed_by_name || 'System Auto'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-sm">
                      {log.details ? (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {Object.entries(log.details).map(([key, val]) => {
                            if (val == null) return null
                            return (
                              <span key={key} className="bg-slate-50 border border-slate-100 px-2.5 py-1 rounded shadow-sm text-slate-600 flex gap-1 items-center">
                                <span className="font-medium text-slate-400 capitalize">{key}:</span> 
                                <span className="font-bold">{String(val)}</span>
                              </span>
                            )
                          })}
                        </div>
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
    </div>
  )
}
