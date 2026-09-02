import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApplicationHistory } from '@/services/internshipApi'
import type { ApplicationHistoryEntry } from '@/types'

export default function ApplicationHistoryPage() {
  const [entries, setEntries] = useState<ApplicationHistoryEntry[]>([])
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getApplicationHistory(page)
      .then((response) => {
        if (!active) return
        setEntries(response.results)
        setCount(response.count)
        setHasNext(Boolean(response.next))
        setHasPrevious(Boolean(response.previous))
      })
      .catch((requestError: any) => {
        if (active) setError(requestError.response?.data?.detail || 'Unable to load application history.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [page])

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-800">Back to Dashboard</Link>
        <div className="mt-3 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Application History</h1>
          <p className="mt-2 text-gray-600">{count} Apply action{count === 1 ? '' : 's'} recorded</p>
        </div>
        {loading && <p className="text-gray-600">Loading history...</p>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
        {!loading && !error && entries.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600">No application history yet.</div>
        )}
        {!loading && !error && entries.length > 0 && (
          <div className="space-y-3">
            {entries.map((entry) => (
              <Link key={entry.id} to={`/internships/${entry.internship}`} className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:border-indigo-300">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{entry.internship_title}</h2>
                    <p className="text-sm text-gray-600">{entry.organization_name} | Apply clicked</p>
                  </div>
                  <time className="text-sm text-gray-500" dateTime={entry.applied_date}>{new Date(entry.applied_date).toLocaleString()}</time>
                </div>
              </Link>
            ))}
          </div>
        )}
        {(hasNext || hasPrevious) && (
          <div className="mt-8 flex justify-center gap-3">
            <button disabled={!hasPrevious} onClick={() => setPage((current) => current - 1)} className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
            <button disabled={!hasNext} onClick={() => setPage((current) => current + 1)} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </main>
  )
}