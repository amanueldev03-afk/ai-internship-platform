import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAIMonitoringData, type AdminAIMonitoringData } from '@/services/adminApi'

export default function AdminAIMonitoring() {
  const navigate = useNavigate()
  const [data, setData] = useState<AdminAIMonitoringData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    getAIMonitoringData()
      .then((d) => { if (isCurrent) setData(d) })
      .catch(() => { if (isCurrent) setError('Failed to load AI monitoring data.') })
      .finally(() => { if (isCurrent) setIsLoading(false) })
    return () => { isCurrent = false }
  }, [])

  const maxDaily = data ? Math.max(...data.recommendations_per_day.map((d) => d.count), 1) : 1
  const totalRecommendations = data
    ? data.score_distribution.reduce((sum, b) => sum + b.count, 0)
    : 0

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <button onClick={() => navigate('/admin/dashboard')} className="mb-2 text-sm text-indigo-600 hover:text-indigo-500">&larr; Back to Dashboard</button>
          <h1 className="text-2xl font-bold text-slate-900">AI Monitoring</h1>
          <p className="mt-1 text-sm text-slate-500">Recommendation engine statistics and performance</p>
        </header>

        {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

        {isLoading ? (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading AI monitoring data...</p>
        ) : data && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Total Recommendations</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{totalRecommendations}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Average Match Score</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {data.average_match_score !== null ? `${data.average_match_score.toFixed(1)}%` : 'No data'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Days with Data</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{data.recommendations_per_day.length}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Recommendations Per Day</h2>
                {data.recommendations_per_day.length === 0 ? (
                  <p className="mt-6 text-sm text-slate-500">No recommendation data available yet.</p>
                ) : (
                  <div className="mt-5 space-y-2">
                    {data.recommendations_per_day.map((day) => (
                      <div key={day.date} className="flex items-center gap-3">
                        <span className="w-24 text-xs text-slate-500">{day.date}</span>
                        <div className="flex-1 h-5 rounded bg-slate-100">
                          <div
                            className="h-5 rounded bg-indigo-500"
                            style={{ width: `${(day.count / maxDaily) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-medium text-slate-700">{day.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Score Distribution</h2>
                {totalRecommendations === 0 ? (
                  <p className="mt-6 text-sm text-slate-500">No recommendation data available yet.</p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {data.score_distribution.map((bucket) => {
                      const maxBucket = Math.max(...data.score_distribution.map((b) => b.count), 1)
                      return (
                        <div key={bucket.range}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{bucket.range}</span>
                            <span className="text-slate-500">{bucket.count}</span>
                          </div>
                          <div className="h-3 rounded-full bg-slate-100">
                            <div
                              className="h-3 rounded-full bg-indigo-600"
                              style={{ width: `${(bucket.count / maxBucket) * 100}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
