export default function AdminLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* 4 Skeleton Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse"></div>
            </div>
            <div className="h-8 w-1/2 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-3 w-1/3 bg-slate-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Skeleton Filter Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-4">
          <div className="h-10 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Skeleton Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-9 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
        
        <div className="p-0">
          <div className="grid grid-cols-6 border-b border-slate-100 p-4 bg-slate-50/50 gap-4 hidden sm:grid">
             {[...Array(6)].map((_, i) => (
               <div key={i} className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
             ))}
          </div>
          {[...Array(5)].map((_, i) => (
             <div key={i} className="grid grid-cols-1 sm:grid-cols-6 p-4 border-b border-slate-50 gap-4">
               {[...Array(6)].map((_, j) => (
                 <div key={j} className="h-4 w-full sm:max-w-[80%] bg-slate-200 rounded animate-pulse"></div>
               ))}
             </div>
          ))}
        </div>
      </div>
    </div>
  )
}
