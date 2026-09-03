import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDataSourceHealth, type DataSourceHealthItem } from '@/services/adminApi'

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
  )
}

export default function AdminDataSourceHealth() {
  const navigate = useNavigate()
  const [sources, setSources] = useState<DataSourceHealthItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    getDataSourceHealth()
      .then((data) => { if (isCurrent) setSources(data) })
      .catch(() => { if (isCurrent) setError('Failed to load data source health.') })
      .finally(() => { if (isCurrent) setIsLoading(false) })
    return () => { isCurrent = false }
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <button onClick={() => navigate('/admin/dashboard')} className="mb-2 text-sm text-indigo-600 hover:text-indigo-500">&larr; Back to Dashboard</button>
          <h1 className="text-2xl font-bold text-slate-900">Data Source Health</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor data collection sources and their status</p>
        </header>

        {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

        {isLoading ? (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading data sources...</p>
        ) : sources.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <p className="text-lg font-medium text-slate-900">No data sources configured</p>
            <p className="mt-1 text-sm text-slate-500">Add data sources through the admin to start collecting internships.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map((source) => (
              <div key={source.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusDot active={source.is_active} />
                      <h3 className="text-base font-semibold text-slate-900">{source.name}</h3>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{source.source_type}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{source.website_url || 'No website URL configured'}</p>
                  </div>
                  <div className="text-right text-sm text-slate-500">{source.total_runs} runs</div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Status</p>
                    <p className={`text-sm font-medium ${source.is_active ? 'text-green-700' : 'text-red-700'}`}>
                      {source.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="rounded bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Last Synced</p>
                    <p className="text-sm font-medium text-slate-700">
                      {source.last_synced_at ? new Date(source.last_synced_at).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <div className="rounded bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Last Run</p>
                    <p className="text-sm font-medium text-slate-700">
                      {source.last_run_status ? `${source.last_run_status} (${source.last_run_completed_at ? new Date(source.last_run_completed_at).toLocaleString() : 'running'})` : 'Never'}
                    </p>
                  </div>
                  <div className="rounded bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Records Created</p>
                    <p className="text-sm font-medium text-slate-700">
                      {source.last_records_created}
                    </p>
                  </div>
                </div>
                {source.last_error && <p className="mt-3 rounded bg-red-50 p-2 text-xs text-red-700">Last error: {source.last_error}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
