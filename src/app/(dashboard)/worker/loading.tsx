export default function WorkerLoading() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
      </div>

      {/* Skeleton Stat Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 max-w-sm">
        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-4"></div>
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Skeleton Form Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-6"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-slate-200 rounded-xl animate-pulse"></div>
            </div>
          ))}
          <div className="h-12 w-full bg-slate-200 rounded-xl animate-pulse mt-6"></div>
        </div>

        {/* Skeleton List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100">
             <div className="h-6 w-40 bg-slate-200 rounded animate-pulse"></div>
          </div>
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-3 w-full sm:w-1/2">
                   <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                   <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-20 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
